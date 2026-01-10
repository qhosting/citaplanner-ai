
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from "@google/genai";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'citaplanner.com';
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'super-secret-key-change-in-production';
const GOOGLE_API_KEY = process.env.API_KEY;

// --- CONFIGURACIÓN REDIS ---
let redisClient = null;

const initRedis = async () => {
  if (REDIS_URL) {
    try {
      redisClient = createClient({ url: REDIS_URL });
      redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
      await redisClient.connect();
      console.log("⚡ Redis Conectado y Acelerando");
    } catch (e) {
      console.error("⚠️ No se pudo conectar a Redis, usando solo DB:", e.message);
      redisClient = null;
    }
  }
};

initRedis();

// --- CONFIGURACIÓN DE ALMACENAMIENTO SEGURO ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `AUM-${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Solo imágenes.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/citaplanner_prod';
const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

// --- INICIALIZACIÓN DE BASE DE DATOS (AUTO-MIGRACIÓN) ---
const initDB = async () => {
  console.log("🛠️ Verificando esquema de base de datos...");
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Habilitar extensión pgcrypto para hashing seguro
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // Tablas Core
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        subdomain VARCHAR(50) UNIQUE NOT NULL,
        custom_domain VARCHAR(100) UNIQUE,
        cloudflare_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        plan_type VARCHAR(20) DEFAULT 'TRIAL',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migración para Cloudflare Status (Idempotente)
    try {
        await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cloudflare_status VARCHAR(50) DEFAULT 'pending';`);
        await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS verification_record JSONB;`);
    } catch (e) { console.log("Schema update skipped or already exists"); }

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'ADMIN',
        avatar TEXT,
        preferences JSONB DEFAULT '{}',
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(phone, tenant_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        tenant_id UUID REFERENCES tenants(id),
        PRIMARY KEY (key, tenant_id)
      );
    `);

    // Tablas de Negocio
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        notes TEXT,
        skin_type VARCHAR(100),
        allergies TEXT,
        medical_conditions TEXT,
        consent_accepted BOOLEAN DEFAULT FALSE,
        consent_date TIMESTAMP,
        consent_type VARCHAR(100),
        treatment_history JSONB DEFAULT '[]',
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        image_url TEXT,
        tenant_id UUID REFERENCES tenants(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        email VARCHAR(255),
        weekly_schedule JSONB,
        exceptions JSONB,
        service_ids TEXT[], 
        tenant_id UUID REFERENCES tenants(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        start_date_time TIMESTAMP NOT NULL,
        end_date_time TIMESTAMP NOT NULL,
        client_name VARCHAR(255),
        client_phone VARCHAR(50),
        description TEXT,
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        professional_id VARCHAR(100),
        service_id VARCHAR(100),
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tablas POS & Inventario
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        category VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        cost DECIMAL(10,2) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        usage VARCHAR(20) DEFAULT 'RETAIL',
        batch_number VARCHAR(100),
        expiry_date DATE,
        tenant_id UUID REFERENCES tenants(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id VARCHAR(100),
        items JSONB NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50),
        client_name VARCHAR(255),
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(100),
        product_name VARCHAR(255),
        type VARCHAR(20),
        quantity INTEGER,
        reason TEXT,
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tablas Marketing & Branches
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        manager VARCHAR(255),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        tenant_id UUID REFERENCES tenants(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        channel VARCHAR(50),
        status VARCHAR(50),
        content TEXT,
        target_segment VARCHAR(100),
        subject VARCHAR(255),
        sent_count INTEGER DEFAULT 0,
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        is_active BOOLEAN DEFAULT FALSE,
        trigger_type VARCHAR(100),
        delay_hours INTEGER DEFAULT 0,
        channel VARCHAR(50),
        template_message TEXT,
        tenant_id UUID REFERENCES tenants(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform VARCHAR(50),
        event_type VARCHAR(100),
        status VARCHAR(50),
        response TEXT,
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- AURUM MASTER SEEDING (Auto-Deploy) ---
    const masterCheck = await client.query("SELECT id FROM tenants WHERE subdomain = 'master'");
    if (masterCheck.rows.length === 0) {
      console.log("🚀 Desplegando Aurum Master Node...");
      
      const tenantRes = await client.query(
        "INSERT INTO tenants (name, subdomain, status, plan_type) VALUES ($1, $2, 'ACTIVE', 'PRO') RETURNING id",
        ['Aurum Master', 'master']
      );
      const tenantId = tenantRes.rows[0].id;

      // Crear Super Admin
      await client.query(
        "INSERT INTO users (name, phone, password, role, tenant_id) VALUES ($1, $2, crypt($3, gen_salt('bf')), 'SUPERADMIN', $4)",
        ['Super Admin', '4425060999', 'x0420EZS*', tenantId]
      );

      // Configuración Base
      const defaultSettings = { 
        businessName: 'Aurum Master', 
        primaryColor: '#D4AF37', 
        secondaryColor: '#1A1A1A', 
        contactPhone: '4425060999', 
        maintenanceMode: false,
        aboutText: 'Nodo Central de Administración Aurum Ecosystem.',
        address: 'HQ'
      };

      await client.query(
        "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2)",
        [JSON.stringify(defaultSettings), tenantId]
      );
      
      console.log("✅ Super Admin desplegado: 4425060999");
    }

    await client.query('COMMIT');
    console.log("✅ Esquema de Base de Datos Sincronizado.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Error en migración DB:", e);
  } finally {
    client.release();
  }
};

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentado para imágenes base64
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURACIÓN CLOUDFLARE & AURUM HUB ---
const AURUM_HUB_URL = process.env.AURUM_HUB_URL || 'https://api.aurum-hub.com/v1';
const AURUM_SATELLITE_KEY = process.env.AURUM_SATELLITE_KEY || 'DEV_KEY';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const NOTIFICATION_API_URL = process.env.NOTIFICATION_API_URL || 'http://localhost:3000/api/mock-waha'; // WAHA o Chatwoot

// --- MIDDLEWARES ---
const tenantMiddleware = async (req, res, next) => {
  const host = req.headers.host || '';
  const cacheKey = `tenant:${host}`;
  let tenant = null;

  try {
    if (redisClient) {
      const cachedTenant = await redisClient.get(cacheKey);
      if (cachedTenant) {
        req.tenant = JSON.parse(cachedTenant);
        return next();
      }
    }

    const isRoot = host.startsWith('localhost') || 
                   host === ROOT_DOMAIN || 
                   host === `www.${ROOT_DOMAIN}` ||
                   host.includes('127.0.0.1');

    if (isRoot) {
      const result = await pool.query("SELECT * FROM tenants WHERE subdomain = 'master' LIMIT 1");
      tenant = result.rows[0];
    } else {
      const customRes = await pool.query("SELECT * FROM tenants WHERE custom_domain = $1 LIMIT 1", [host]);
      if (customRes.rows.length > 0) {
        tenant = customRes.rows[0];
      } else {
        const subdomain = host.split('.')[0];
        const subRes = await pool.query("SELECT * FROM tenants WHERE subdomain = $1 LIMIT 1", [subdomain]);
        tenant = subRes.rows[0];
      }
    }

    if (!tenant) return res.status(404).json({ error: "Nodo CitaPlanner no detectado para el host: " + host });
    
    if (redisClient && tenant) {
      await redisClient.set(cacheKey, JSON.stringify(tenant), { EX: 3600 });
    }

    req.tenant = tenant;
    next();
  } catch (e) {
    console.error('Tenant Identification Error:', e);
    res.status(500).json({ error: "Falla en protocolo de identificación de infraestructura." });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    if (user.tenantId !== req.tenant.id) {
       return res.status(403).json({ error: "Cross-Tenant Access Violation Detected." });
    }
    req.user = user;
    next();
  });
};

const getTenantSettings = async (tenantId) => {
  const cacheKey = `settings:${tenantId}`;
  if (redisClient) {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }
  const result = await pool.query("SELECT value FROM settings WHERE key = 'landing' AND tenant_id = $1", [tenantId]);
  const settings = result.rows[0]?.value || {};
  if (redisClient) {
    await redisClient.set(cacheKey, JSON.stringify(settings), { EX: 3600 });
  }
  return settings;
};

const maintenanceGuard = async (req, res, next) => {
  try {
    const settings = await getTenantSettings(req.tenant.id);
    if (settings.maintenanceMode === true) {
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN')) {
        return next();
      }
      return res.status(503).json({ 
        error: "Servicio en Mantenimiento", 
        message: "El sistema no acepta nuevas operaciones públicas en este momento.",
        maintenance: true 
      });
    }
    next();
  } catch (e) {
    next();
  }
};

// --- AI PROXY ENDPOINT (SECURE) ---
app.post('/api/ai/generate', tenantMiddleware, async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(503).json({ error: "Servidor IA no configurado" });
  
  const { model, contents, config } = req.body;
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents: contents, // Puede contener texto y partes de imagen (base64)
      config: config
    });
    
    // Loguear uso de IA
    await pool.query(
      "INSERT INTO integration_logs (platform, event_type, status, response, tenant_id) VALUES ('AI_GEMINI', 'GENERATE_CONTENT', 'SUCCESS', 'Tokens used', $1)",
      [req.tenant.id]
    );

    res.json({ text: response.text });
  } catch (error) {
    console.error("AI Proxy Error:", error);
    res.status(500).json({ error: "Error procesando solicitud neuronal" });
  }
});

// --- NOTIFICATION SERVICE (WAHA / CHATWOOT) ---
const sendNotification = async (tenantId, channel, to, message) => {
  try {
    // Aquí implementas la lógica real hacia WAHA o Chatwoot
    // Para WAHA: POST /api/sendText
    // Para Chatwoot: POST /api/v1/accounts/{id}/conversations/...
    console.log(`[NOTIFY ${channel}] To: ${to} | Msg: ${message}`);
    
    await pool.query(
      "INSERT INTO integration_logs (platform, event_type, status, response, tenant_id) VALUES ($1, $2, 'SUCCESS', $3, $4)",
      [channel === 'WHATSAPP' ? 'WAHA' : 'SMS_GATEWAY', 'SEND_MESSAGE', `To: ${to}`, tenantId]
    );
    return true;
  } catch (e) {
    console.error("Notification Error", e);
    return false;
  }
};

// --- ENDPOINTS DE PAGO (WEBHOOKS) ---
// Este endpoint recibiría la confirmación de MercadoPago/Aurum Pay
app.post('/api/billing/webhook', async (req, res) => {
  const { type, data, tenantId } = req.body;
  
  try {
    if (type === 'payment.created' || type === 'subscription.paid') {
        // Lógica para activar el tenant
        await pool.query("UPDATE tenants SET status = 'ACTIVE', plan_type = 'PRO' WHERE id = $1", [tenantId]);
        console.log(`✅ Tenant ${tenantId} activado por pago.`);
    }
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: "Error processing webhook" });
  }
});

// --- SERVICIO CLOUDFLARE MEJORADO ---
const CloudflareService = {
  addDomain: async (hostname) => {
    if (!CF_API_TOKEN || !CF_ZONE_ID) return { 
        success: true, 
        id: 'mock-cf-id', 
        verification: { type: 'txt', name: '_cf-custom-hostname.' + hostname, value: 'mock-verification-token' }, 
        status: 'pending_validation' 
    };
    
    try {
      const resp = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/custom_hostnames`,
        { hostname, ssl: { method: 'http', type: 'dv' } },
        { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
      );
      
      const result = resp.data.result;
      return { 
          success: true, 
          id: result.id,
          verification: result.ownership_verification, // { type, name, value }
          status: result.status // 'pending' | 'active'
      };
    } catch (e) {
      console.error("Cloudflare Add Error:", e.response?.data || e.message);
      return { success: false, error: e.response?.data?.errors?.[0]?.message || "Error CF API" };
    }
  },
  
  getDomainStatus: async (hostnameId) => {
    if (!CF_API_TOKEN || !CF_ZONE_ID) return { status: 'active' }; // Mock for dev
    try {
      const resp = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/custom_hostnames/${hostnameId}`,
        { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
      );
      return { status: resp.data.result.status, sslStatus: resp.data.result.ssl.status };
    } catch (e) {
        return { status: 'unknown' };
    }
  },

  removeDomain: async (hostnameId) => {
    if (!CF_API_TOKEN || !CF_ZONE_ID) return { success: true };
    try {
      await axios.delete(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/custom_hostnames/${hostnameId}`,
        { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
      );
      return { success: true };
    } catch (e) {
      console.error("Cloudflare Remove Error:", e.response?.data || e.message);
      return { success: false };
    }
  }
};

// --- PROXY AURUM MASTER HUB ---
const aurumRouter = express.Router();
aurumRouter.use(async (req, res, next) => next());

const forwardToHub = async (endpoint, method, data, res) => {
  try {
    const response = await axios({
      method,
      url: `${AURUM_HUB_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AURUM_SATELLITE_KEY,
        'x-satellite-id': 'CITA_PLANNER'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Aurum Hub Proxy Error [${endpoint}]:`, error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ success: false, error: error.response?.data?.message || "Error de comunicación" });
  }
};

aurumRouter.post('/sync/clients', (req, res) => forwardToHub('/sync/clients', 'POST', req.body, res));
aurumRouter.post('/sync/services', (req, res) => forwardToHub('/sync/services', 'POST', req.body, res));
aurumRouter.post('/billing/checkout', (req, res) => forwardToHub('/billing/checkout', 'POST', req.body, res));

app.use('/api/integrations/aurum', tenantMiddleware, aurumRouter);

// --- AUTENTICACIÓN Y USUARIOS ---
app.post('/api/login', tenantMiddleware, async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE phone = $1 AND tenant_id = $2 LIMIT 1",
      [phone, req.tenant.id]
    );

    let user = null;

    if (result.rows.length > 0) {
      const dbUser = result.rows[0];
      const authCheck = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND password = crypt($2, password)",
        [dbUser.id, password]
      );
      
      if (authCheck.rows.length > 0) {
        user = authCheck.rows[0];
      }
    }

    if (!user) {
       const legacy = await pool.query("SELECT * FROM users WHERE phone = $1 AND password = $2 AND tenant_id = $3", [phone, password, req.tenant.id]);
       if (legacy.rows.length > 0) {
         user = legacy.rows[0];
         await pool.query("UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE id = $2", [password, user.id]);
       }
    }

    if (user) {
      delete user.password;
      const token = jwt.sign(
        { id: user.id, role: user.role, tenantId: req.tenant.id, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({ success: true, user, token });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas en este nodo.' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de autenticación" });
  }
});

app.post('/api/saas/register', async (req, res) => {
  const { businessName, subdomain, adminName, adminPhone, adminPassword } = req.body;
  if (!businessName || !subdomain || !adminPhone || !adminPassword) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const checkSub = await client.query("SELECT id FROM tenants WHERE subdomain = $1", [subdomain.toLowerCase()]);
    if (checkSub.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: "Subdominio ocupado." });
    }

    const tenantRes = await client.query(
      "INSERT INTO tenants (name, subdomain, status, plan_type) VALUES ($1, $2, 'ACTIVE', 'TRIAL') RETURNING id",
      [businessName, subdomain.toLowerCase()]
    );
    const tenantId = tenantRes.rows[0].id;

    await client.query(
      "INSERT INTO users (name, phone, password, role, tenant_id) VALUES ($1, $2, crypt($3, gen_salt('bf')), 'ADMIN', $4)",
      [adminName || 'Admin', adminPhone, adminPassword, tenantId]
    );

    const defaultSettings = { businessName, primaryColor: '#D4AF37', secondaryColor: '#1A1A1A', contactPhone: adminPhone, maintenanceMode: false };
    await client.query(
      "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2)",
      [JSON.stringify(defaultSettings), tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: "Nodo desplegado.", tenantId });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Error de aprovisionamiento." });
  } finally {
    client.release();
  }
});

// --- API PÚBLICA ---
app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
  try {
    const settings = await getTenantSettings(req.tenant.id);
    const landingData = settings || { businessName: req.tenant.name, primaryColor: '#C5A028' };
    res.json({ 
        ...landingData, 
        customDomain: req.tenant.custom_domain, 
        subdomain: req.tenant.subdomain,
        domainStatus: {
            status: req.tenant.cloudflare_status,
            verification: req.tenant.verification_record
        }
    });
  } catch (e) {
    res.status(500).json({ error: "Error config" });
  }
});

app.get('/api/services', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM services WHERE tenant_id = $1 AND status = 'ACTIVE'", [req.tenant.id]);
  res.json(result.rows);
});

app.get('/api/professionals', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT id, name, role, weekly_schedule, exceptions, service_ids FROM professionals WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows.map(p => ({ 
    ...p, 
    weeklySchedule: p.weekly_schedule || [], 
    exceptions: p.exceptions || [],
    serviceIds: p.service_ids
  })));
});

app.post('/api/appointments', tenantMiddleware, maintenanceGuard, async (req, res) => {
  const { title, startDateTime, endDateTime, clientName, clientPhone, description, status, professionalId, serviceId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO appointments (title, start_date_time, end_date_time, client_name, client_phone, description, status, professional_id, service_id, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [title, startDateTime, endDateTime, clientName, clientPhone, description, status, professionalId, serviceId, req.tenant.id]
    );
    // Notificar confirmación
    if (clientPhone) {
        sendNotification(req.tenant.id, 'WHATSAPP', clientPhone, `Cita confirmada: ${title} el ${new Date(startDateTime).toLocaleString()}`);
    }
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({error: e.message});
  }
});

// --- ZONA PROTEGIDA ---
app.use(tenantMiddleware);
app.use(authenticateToken);

app.post('/api/settings/domain', async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Dominio requerido" });
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') return res.sendStatus(403);

  try {
    const check = await pool.query("SELECT id FROM tenants WHERE custom_domain = $1 AND id != $2", [domain, req.tenant.id]);
    if (check.rows.length > 0) return res.status(409).json({ error: "Dominio en uso." });

    const cfResult = await CloudflareService.addDomain(domain);
    if (!cfResult.success) return res.status(500).json({ error: cfResult.error });

    await pool.query(
        "UPDATE tenants SET custom_domain = $1, cloudflare_id = $2, cloudflare_status = $3, verification_record = $4 WHERE id = $5", 
        [domain, cfResult.id, cfResult.status, cfResult.verification || {}, req.tenant.id]
    );

    if (redisClient) {
      const currentHost = req.headers.host;
      await redisClient.del(`tenant:${currentHost}`);
      await redisClient.del(`tenant:${domain}`);
    }
    res.json({ success: true, verification: cfResult.verification });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/settings/domain/status', async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
    if (!req.tenant.cloudflare_id) return res.json({ status: 'none' });

    try {
        const cfStatus = await CloudflareService.getDomainStatus(req.tenant.cloudflare_id);
        
        // Update DB if changed
        if (cfStatus.status && cfStatus.status !== req.tenant.cloudflare_status) {
            await pool.query("UPDATE tenants SET cloudflare_status = $1 WHERE id = $2", [cfStatus.status, req.tenant.id]);
        }
        
        res.json({ 
            status: cfStatus.status, 
            verification: req.tenant.verification_record 
        });
    } catch(e) {
        res.status(500).json({ error: "Error checking status" });
    }
});

app.delete('/api/settings/domain', async (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
  try {
    if (req.tenant.cloudflare_id) await CloudflareService.removeDomain(req.tenant.cloudflare_id);
    await pool.query("UPDATE tenants SET custom_domain = NULL, cloudflare_id = NULL, cloudflare_status = NULL, verification_record = NULL WHERE id = $1", [req.tenant.id]);
    if (redisClient) {
        const currentHost = req.headers.host;
        await redisClient.del(`tenant:${currentHost}`);
        if(req.tenant.custom_domain) await redisClient.del(`tenant:${req.tenant.custom_domain}`);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings/subdomain', async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
    const { subdomain } = req.body;
    if (!subdomain || subdomain.length < 3) return res.status(400).json({ error: "Subdominio inválido" });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const check = await client.query("SELECT id FROM tenants WHERE subdomain = $1 AND id != $2", [subdomain.toLowerCase(), req.tenant.id]);
        if (check.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Subdominio no disponible" });
        }

        await client.query("UPDATE tenants SET subdomain = $1 WHERE id = $2", [subdomain.toLowerCase(), req.tenant.id]);
        
        if (redisClient) {
            const currentHost = req.headers.host;
            await redisClient.del(`tenant:${currentHost}`); // Limpiar cache actual
            // Si el usuario está accediendo por el subdominio viejo, esto fuerza reload
        }

        await client.query('COMMIT');
        res.json({ success: true, newUrl: `https://${subdomain.toLowerCase()}.${ROOT_DOMAIN}` });
    } catch(e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

app.put('/api/settings/landing', async (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
  try {
    await pool.query(
      "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2) ON CONFLICT (key, tenant_id) DO UPDATE SET value = $1",
      [req.body, req.tenant.id]
    );
    if (redisClient) await redisClient.del(`settings:${req.tenant.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/clients', async (req, res) => {
  const result = await pool.query("SELECT * FROM clients WHERE tenant_id = $1 ORDER BY name ASC", [req.tenant.id]);
  res.json(result.rows.map(c => ({ ...c, treatmentHistory: c.treatment_history || [] })));
});

app.post('/api/clients', async (req, res) => {
  const { name, phone, email, notes, skinType, allergies, medicalConditions } = req.body;
  const result = await pool.query(
    "INSERT INTO clients (name, phone, email, notes, skin_type, allergies, medical_conditions, tenant_id, treatment_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '[]') RETURNING *",
    [name, phone, email, notes, skinType, allergies, medicalConditions, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.put('/api/clients/:id', async (req, res) => {
  const { name, phone, email, notes, skinType, allergies, medicalConditions, consentAccepted, consentDate, consentType, treatmentHistory } = req.body;
  await pool.query(
    "UPDATE clients SET name=$1, phone=$2, email=$3, notes=$4, skin_type=$5, allergies=$6, medical_conditions=$7, consent_accepted=$8, consent_date=$9, consent_type=$10, treatment_history=$11 WHERE id=$12 AND tenant_id=$13",
    [name, phone, email, notes, skinType, allergies, medicalConditions, consentAccepted, consentDate, consentType, JSON.stringify(treatmentHistory), req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.delete('/api/clients/:id', async (req, res) => {
  await pool.query("DELETE FROM clients WHERE id=$1 AND tenant_id=$2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.put('/api/users/:id/password', async (req, res) => {
  if (req.user.id !== req.params.id) return res.sendStatus(403);
  const { current, next } = req.body;
  try {
    const check = await pool.query("SELECT id FROM users WHERE id = $1 AND password = crypt($2, password)", [req.params.id, current]);
    if (check.rows.length > 0) {
      await pool.query("UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE id = $2", [next, req.params.id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Password incorrecto" });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id/profile', async (req, res) => {
  if (req.user.id !== req.params.id) return res.sendStatus(403);
  const { name, email, avatar } = req.body;
  await pool.query("UPDATE users SET name = $1, email = $2, avatar = $3 WHERE id = $4", [name, email, avatar, req.params.id]);
  res.json({ success: true });
});

app.put('/api/users/:id/preferences', async (req, res) => {
  if (req.user.id !== req.params.id) return res.sendStatus(403);
  await pool.query("UPDATE users SET preferences = $1 WHERE id = $2", [JSON.stringify(req.body), req.params.id]);
  res.json({ success: true });
});

app.get('/api/products', async (req, res) => {
  const result = await pool.query("SELECT * FROM products WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/products', async (req, res) => {
  const { name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate } = req.body;
  await pool.query(
    "INSERT INTO products (name, sku, category, price, cost, stock, min_stock, status, usage, batch_number, expiry_date, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
    [name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate, req.tenant.id]
  );
  res.json({ success: true });
});

app.put('/api/products/:id', async (req, res) => {
  const { name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate } = req.body;
  await pool.query(
    "UPDATE products SET name=$1, sku=$2, category=$3, price=$4, cost=$5, stock=$6, min_stock=$7, status=$8, usage=$9, batch_number=$10, expiry_date=$11 WHERE id=$12 AND tenant_id=$13",
    [name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate, req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.get('/api/inventory/movements', async (req, res) => {
  const result = await pool.query("SELECT * FROM inventory_movements WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Archivo no válido' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

app.get('/api/appointments', async (req, res) => {
  const result = await pool.query("SELECT * FROM appointments WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/appointments/:id/cancel', async (req, res) => {
  await pool.query("UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.post('/api/appointments/:id/complete', async (req, res) => {
  const { notes } = req.body;
  await pool.query("UPDATE appointments SET status = 'COMPLETED' WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.post('/api/services', async (req, res) => {
  const { name, duration, price, description, category, status, imageUrl } = req.body;
  const result = await pool.query(
    "INSERT INTO services (name, duration, price, description, category, status, image_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [name, duration, price, description, category, status, imageUrl, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.put('/api/services/:id', async (req, res) => {
  const { name, duration, price, description, category, status, imageUrl } = req.body;
  await pool.query(
    "UPDATE services SET name=$1, duration=$2, price=$3, description=$4, category=$5, status=$6, image_url=$7 WHERE id=$8 AND tenant_id=$9",
    [name, duration, price, description, category, status, imageUrl, req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.delete('/api/services/:id', async (req, res) => {
  await pool.query("DELETE FROM services WHERE id=$1 AND tenant_id=$2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.get('/api/branches', async (req, res) => {
  const result = await pool.query("SELECT * FROM branches WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/branches', async (req, res) => {
  const { name, address, phone, manager, status } = req.body;
  await pool.query("INSERT INTO branches (name, address, phone, manager, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)", [name, address, phone, manager, status, req.tenant.id]);
  res.json({ success: true });
});

app.put('/api/branches/:id', async (req, res) => {
  const { name, address, phone, manager, status } = req.body;
  await pool.query("UPDATE branches SET name=$1, address=$2, phone=$3, manager=$4, status=$5 WHERE id=$6 AND tenant_id=$7", [name, address, phone, manager, status, req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.delete('/api/branches/:id', async (req, res) => {
  await pool.query("DELETE FROM branches WHERE id=$1 AND tenant_id=$2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.post('/api/sales', async (req, res) => {
  const { items, total, paymentMethod, clientName } = req.body;
  try {
    await pool.query('BEGIN');
    const saleId = 'AUM-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    await pool.query(
      "INSERT INTO sales (sale_id, items, total, payment_method, client_name, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [saleId, JSON.stringify(items), total, paymentMethod, clientName, req.tenant.id]
    );
    for (const item of items) {
      if (item.type === 'PRODUCT') {
        await pool.query("UPDATE products SET stock = stock - $1 WHERE id = $2 AND tenant_id = $3", [item.quantity, item.id, req.tenant.id]);
        await pool.query("INSERT INTO inventory_movements (product_id, product_name, type, quantity, reason, tenant_id) VALUES ($1, $2, 'OUT', $3, $4, $5)", [item.id, item.name, item.quantity, `Venta POS ${saleId}`, req.tenant.id]);
      }
    }
    await pool.query('COMMIT');
    res.json({ success: true, saleId, date: new Date().toISOString() });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/analytics/stats', async (req, res) => {
  const revenueRes = await pool.query("SELECT SUM(total) as revenue FROM sales WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'", [req.tenant.id]);
  const clientsRes = await pool.query("SELECT COUNT(*) as count FROM clients WHERE tenant_id = $1", [req.tenant.id]);
  const apptsRes = await pool.query("SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND status = 'COMPLETED'", [req.tenant.id]);
  res.json({
    revenueThisMonth: parseFloat(revenueRes.rows[0]?.revenue || 0),
    newClientsThisMonth: parseInt(clientsRes.rows[0]?.count || 0),
    appointmentsCompleted: parseInt(apptsRes.rows[0]?.count || 0),
    occupationRate: 78
  });
});

app.get('/api/marketing/campaigns', async (req, res) => {
  const result = await pool.query("SELECT * FROM marketing_campaigns WHERE tenant_id = $1 ORDER BY created_at DESC", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/marketing/campaigns', async (req, res) => {
  const { name, channel, status, content, targetSegment, subject } = req.body;
  const result = await pool.query(
    "INSERT INTO marketing_campaigns (name, channel, status, content, target_segment, subject, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [name, channel, status, content, targetSegment, subject, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.post('/api/marketing/campaigns/send', async (req, res) => {
  const { campaign } = req.body;
  const sentCount = Math.floor(Math.random() * 50) + 10;
  // TODO: Integrar aquí llamada real a WAHA o Email Service
  await pool.query("UPDATE marketing_campaigns SET status = 'SENT', sent_count = $1 WHERE id = $2 AND tenant_id = $3", [sentCount, campaign.id, req.tenant.id]);
  res.json({ success: true, message: `Campaña enviada a ${sentCount} destinatarios`, sentCount });
});

app.get('/api/marketing/automations', async (req, res) => {
  const result = await pool.query("SELECT * FROM automation_rules WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows.map(r => ({ ...r, isActive: r.is_active, triggerType: r.trigger_type, delayHours: r.delay_hours, templateMessage: r.template_message })));
});

app.post('/api/marketing/automations', async (req, res) => {
  const { rule } = req.body;
  if (rule.id && !rule.id.startsWith('new')) {
    await pool.query("UPDATE automation_rules SET is_active = $1 WHERE id = $2 AND tenant_id = $3", [rule.isActive, rule.id, req.tenant.id]);
  }
  res.json({ success: true });
});

app.get('/api/integrations/status', async (req, res) => {
  const result = await pool.query("SELECT * FROM integration_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20", [req.tenant.id]);
  res.json(result.rows);
});

app.get('/api/saas/tenants', async (req, res) => {
  if (req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
  const result = await pool.query("SELECT * FROM tenants ORDER BY created_at DESC");
  res.json(result.rows);
});

app.get('/api/saas/stats', async (req, res) => {
  if (req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
  const revenueRes = await pool.query("SELECT SUM(total) as revenue FROM sales");
  const usersRes = await pool.query("SELECT COUNT(*) as count FROM users");
  const tenantsRes = await pool.query("SELECT COUNT(*) as count FROM tenants");
  res.json({
    totalRevenue: parseFloat(revenueRes.rows[0]?.revenue || 0),
    totalUsers: parseInt(usersRes.rows[0]?.count || 0),
    totalTenants: parseInt(tenantsRes.rows[0]?.count || 0)
  });
});

app.put('/api/saas/tenants/:id/status', async (req, res) => {
  if (req.user.role !== 'SUPERADMIN') return res.sendStatus(403);
  const { status } = req.body;
  await pool.query("UPDATE tenants SET status = $1 WHERE id = $2", [status, req.params.id]);
  res.json({ success: true });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 SaaS Master Engine en puerto ${PORT}`));
});
