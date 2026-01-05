
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Multer
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/citaplanner_prod';
const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MIDDLEWARE DE TENANT (EL CORAZÓN DEL SAAS) ---
const tenantMiddleware = async (req, res, next) => {
  const host = req.headers.host; // ej: shulastudio.citaplanner.com o beauty.com
  let tenant = null;

  try {
    // Identificar si es el dominio principal o desarrollo local
    if (host === 'citaplanner.com' || host.includes('localhost') || host === 'www.citaplanner.com') {
      const result = await pool.query("SELECT * FROM tenants WHERE subdomain = 'master' LIMIT 1");
      tenant = result.rows[0];
    } else {
      // Extraer subdominio si existe (ej: shulastudio.citaplanner.com -> shulastudio)
      const parts = host.split('.');
      const subdomain = parts.length > 2 ? parts[0] : null;
      
      const result = await pool.query(
        "SELECT * FROM tenants WHERE subdomain = $1 OR custom_domain = $2 LIMIT 1",
        [subdomain, host]
      );
      tenant = result.rows[0];
    }

    if (!tenant) return res.status(404).json({ error: "Nodo CitaPlanner no encontrado para este dominio." });
    
    req.tenant = tenant;
    next();
  } catch (e) {
    console.error("Tenant Identification Error:", e);
    res.status(500).json({ error: "Falla en el protocolo de identificación de instancia." });
  }
};

// --- CLOUDFLARE DNS PROVISIONING ---
const createCloudflareSubdomain = async (subdomain) => {
  const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
  const API_KEY = process.env.CLOUDFLARE_API_KEY;
  const EMAIL = process.env.CLOUDFLARE_EMAIL;

  if (!ZONE_ID || !API_KEY) {
      console.warn("Cloudflare API no configurada. Saltando provisionamiento DNS.");
      return 'manual_id';
  }

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
      {
        type: 'CNAME',
        name: subdomain,
        content: 'citaplanner.com', // CNAME al dominio principal que maneja el wildcard
        ttl: 1,
        proxied: true
      },
      {
        headers: {
          'X-Auth-Email': EMAIL,
          'X-Auth-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.result.id;
  } catch (e) {
    console.error("Cloudflare Error:", e.response?.data || e.message);
    throw new Error("Error al crear registro DNS en Cloudflare");
  }
};

// --- DATABASE SYNC & MULTI-TENANT INIT ---
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        subdomain VARCHAR(50) UNIQUE,
        custom_domain VARCHAR(100) UNIQUE,
        cloudflare_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        plan_type VARCHAR(20) DEFAULT 'PRO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const tables = ['users', 'services', 'products', 'appointments', 'branches', 'settings', 'clients'];
    for (const table of tables) {
      await pool.query(`
        ALTER TABLE ${table} 
        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
      `);
    }

    // Seed Master Tenant
    const master = await pool.query("SELECT id FROM tenants WHERE subdomain = 'master'");
    if (master.rows.length === 0) {
      await pool.query("INSERT INTO tenants (name, subdomain) VALUES ('CitaPlanner Global', 'master')");
    }
    
    console.log("✅ SaaS Core: Arquitectura Multi-tenant Sincronizada");
  } catch (e) {
    console.error('❌ SaaS Init Error:', e.message);
  }
};

// --- TENANT AWARE ENDPOINTS ---

app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'landing' AND tenant_id = $1", 
      [req.tenant.id]
    );
    res.json(result.rows[0]?.value || { businessName: req.tenant.name, primaryColor: '#C5A028' });
  } catch (e) { res.status(500).json({ error: "Error de configuración" }); }
});

app.get('/api/services', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM services WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.get('/api/appointments', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM appointments WHERE tenant_id = $1 ORDER BY start_datetime ASC", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/appointments', tenantMiddleware, async (req, res) => {
  const { title, startDateTime, endDateTime, clientName, clientPhone, description, professionalId, serviceId } = req.body;
  const result = await pool.query(
    "INSERT INTO appointments (title, start_datetime, end_datetime, client_name, client_phone, description, professional_id, service_id, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [title, startDateTime, endDateTime, clientName, clientPhone, description, professionalId, serviceId, req.tenant.id]
  );
  res.json(result.rows[0]);
});

// --- PROVISIONAMIENTO SaaS (SUPERADMIN) ---
app.post('/api/saas/register', async (req, res) => {
  const { name, subdomain, adminPhone, adminPassword } = req.body;
  
  if (!subdomain || subdomain === 'www' || subdomain === 'master') {
    return res.status(400).json({ error: "Subdominio reservado o inválido." });
  }

  try {
    await pool.query('BEGIN');
    
    // 1. Provisionar DNS en Cloudflare
    const cfId = await createCloudflareSubdomain(subdomain);
    
    // 2. Crear Tenant
    const tenantRes = await pool.query(
      "INSERT INTO tenants (name, subdomain, cloudflare_id) VALUES ($1, $2, $3) RETURNING id",
      [name, subdomain, cfId]
    );
    const tenantId = tenantRes.rows[0].id;

    // 3. Crear Usuario Admin Inicial
    await pool.query(
      "INSERT INTO users (name, phone, password, role, tenant_id) VALUES ($1, $2, $3, 'ADMIN', $4)",
      [name + ' Admin', adminPhone, adminPassword, tenantId]
    );

    // 4. Configuración Base del Studio
    const baseLanding = {
        businessName: name,
        primaryColor: '#C5A028',
        slogan: 'Bienvenido a CitaPlanner',
        aboutText: 'Tu nuevo estudio gestionado con inteligencia artificial.'
    };
    await pool.query(
        "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2)",
        [baseLanding, tenantId]
    );

    await pool.query('COMMIT');
    res.json({ success: true, message: `Nodo ${subdomain}.citaplanner.com provisionado.` });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: "Falla en provisionamiento: " + e.message });
  }
});

// Auth por Tenant (Asegura que un usuario solo entre a su instancia)
app.post('/api/login', tenantMiddleware, async (req, res) => {
  const { phone, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE phone = $1 AND password = $2 AND tenant_id = $3",
    [phone, password, req.tenant.id]
  );
  
  if (result.rows.length > 0) {
    res.json({ success: true, user: result.rows[0] });
  } else {
    res.status(401).json({ success: false, error: "Credenciales inválidas en este nodo." });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 CitaPlanner SaaS Engine | Puerto: ${PORT}`));
initDB();
