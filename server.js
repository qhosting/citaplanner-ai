import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from "@google/genai";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'citaplanner.com').toLowerCase();
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'aum-core-secure-2026-fix';

// --- REDIS CONFIG ---
let redisClient = null;
const initRedis = async () => {
  if (REDIS_URL) {
    try {
      redisClient = createClient({ url: REDIS_URL });
      await redisClient.connect();
    } catch (e) { console.error("⚠️ Redis offline"); }
  }
};
initRedis();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// --- SCHEMA & SEEDING ---
const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // 1. Creación de Tablas Core
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        subdomain VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        bridge_enabled BOOLEAN DEFAULT FALSE,
        bridge_webhook_url TEXT,
        bridge_api_key UUID DEFAULT gen_random_uuid(),
        bridge_satellite_id INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'ADMIN',
        tenant_id UUID REFERENCES tenants(id),
        related_id UUID,
        avatar TEXT,
        loyalty_points INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS professionals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        email VARCHAR(255),
        aurum_employee_id VARCHAR(50),
        weekly_schedule JSONB DEFAULT '[]',
        exceptions JSONB DEFAULT '[]',
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        description TEXT,
        image_url TEXT,
        tenant_id UUID REFERENCES tenants(id)
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        start_date_time TIMESTAMP NOT NULL,
        end_date_time TIMESTAMP NOT NULL,
        client_name VARCHAR(255),
        client_phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        description TEXT,
        professional_id UUID REFERENCES professionals(id),
        service_id UUID REFERENCES services(id),
        tenant_id UUID REFERENCES tenants(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        tenant_id UUID REFERENCES tenants(id),
        PRIMARY KEY (key, tenant_id)
      );
    `);

    // 2. CORRECCIÓN: Garantizar índices únicos para ON CONFLICT
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants (subdomain);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_tenant ON users (phone, tenant_id);
    `);

    // 3. Seeding Root (Nodo Maestro)
    const masterIdRes = await client.query(`
      INSERT INTO tenants (name, subdomain) 
      VALUES ('Aurum Global Nexus', 'master') 
      ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name 
      RETURNING id
    `);
    
    const masterId = masterIdRes.rows[0].id;

    // Aseguramos que el usuario Root exista
    await client.query(`
      INSERT INTO users (name, phone, password, role, tenant_id) 
      VALUES ('Aurum Master Root', 'root@aurumcapital.mx', crypt('x0420EZS$$', gen_salt('bf')), 'SUPERADMIN', $1)
      ON CONFLICT (phone, tenant_id) 
      DO UPDATE SET 
        password = EXCLUDED.password, 
        role = 'SUPERADMIN',
        name = EXCLUDED.name
    `, [masterId]);

    await client.query('COMMIT');
    console.log("✅ Infraestructura y Usuario Root Sincronizados.");
  } catch (e) { 
    await client.query('ROLLBACK'); 
    console.error("❌ Error en initDB:", e.message); 
  } finally { 
    client.release(); 
  }
};

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const tenantMiddleware = async (req, res, next) => {
  const host = (req.headers.host || '').toLowerCase();
  const cleanHost = host.split(':')[0]; 
  
  try {
    const isRoot = cleanHost === 'localhost' || cleanHost === ROOT_DOMAIN || cleanHost === `www.${ROOT_DOMAIN}`;
    const subdomain = isRoot ? 'master' : cleanHost.split('.')[0];
    
    const result = await pool.query("SELECT * FROM tenants WHERE subdomain = $1 LIMIT 1", [subdomain]);
    
    if (result.rows.length === 0) {
      const fallback = await pool.query("SELECT * FROM tenants WHERE subdomain = 'master' LIMIT 1");
      if (fallback.rows.length > 0) {
        req.tenant = fallback.rows[0];
        return next();
      }
      return res.status(404).json({ error: "Nodo inexistente" });
    }
    
    req.tenant = result.rows[0];
    next();
  } catch (e) { 
    res.status(500).json({ error: "Falla de red" }); 
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Acceso denegado" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Sesión inválida" });
    req.user = user;
    next();
  });
};

// --- API ROUTES ---
app.post('/api/login', tenantMiddleware, async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE phone = $1 AND tenant_id = $2 AND password = crypt($3, password) LIMIT 1", 
      [phone, req.tenant.id, password]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, role: user.role, tenantId: req.tenant.id }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        success: true, 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          role: user.role, 
          phone: user.phone, 
          tenantId: user.tenant_id, 
          avatar: user.avatar, 
          relatedId: user.related_id,
          loyalty_points: user.loyalty_points
        } 
      });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/ai/generate', authenticateToken, tenantMiddleware, async (req, res) => {
  const { model, contents, config } = req.body;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({ model: model || 'gemini-3-flash-preview', contents, config });
    res.json({ text: response.text });
  } catch (e) { res.status(500).json({ text: "AI Node Offline" }); }
});

app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT value FROM settings WHERE key = 'landing' AND tenant_id = $1", [req.tenant.id]);
  res.json({ ...(result.rows[0]?.value || {}), subdomain: req.tenant.subdomain });
});

// PROFESIONALES
app.get('/api/professionals', authenticateToken, tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT id, name, role, email, aurum_employee_id as \"aurum_employee_id\", weekly_schedule as \"weeklySchedule\", exceptions FROM professionals WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/professionals', authenticateToken, tenantMiddleware, async (req, res) => {
  const { name, role, email, aurum_employee_id, weeklySchedule, exceptions } = req.body;
  try {
    const result = await pool.query("INSERT INTO professionals (name, role, email, aurum_employee_id, weekly_schedule, exceptions, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id", [name, role, email, aurum_employee_id, JSON.stringify(weeklySchedule), JSON.stringify(exceptions), req.tenant.id]);
    res.json({ success: true, id: result.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CITAS
app.get('/api/appointments', authenticateToken, tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT id, title, start_date_time as \"startDateTime\", end_date_time as \"endDateTime\", client_name as \"clientName\", client_phone as \"clientPhone\", status, description, professional_id as \"professionalId\", service_id as \"serviceId\" FROM appointments WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/appointments', authenticateToken, tenantMiddleware, async (req, res) => {
  const { title, startDateTime, endDateTime, clientName, clientPhone, description, professionalId, serviceId } = req.body;
  try {
    await pool.query("INSERT INTO appointments (title, start_date_time, end_date_time, client_name, client_phone, description, professional_id, service_id, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [title, startDateTime, endDateTime, clientName, clientPhone, description, professionalId, serviceId, req.tenant.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SERVICIOS
app.get('/api/services', authenticateToken, tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT id, name, duration, price, category, status, description, image_url as \"imageUrl\" FROM services WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDB().then(() => app.listen(PORT, () => console.log(`🚀 CitaPlanner Operativo en puerto ${PORT} | Root Domain: ${ROOT_DOMAIN}`)));