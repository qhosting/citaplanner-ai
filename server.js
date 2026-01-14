
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
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'citaplanner.com';
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'super-secret-key-change-in-production';

// --- CONFIGURACIÓN REDIS ---
let redisClient = null;
const initRedis = async () => {
  if (REDIS_URL) {
    try {
      redisClient = createClient({ url: REDIS_URL });
      await redisClient.connect();
      console.log("⚡ Redis Operativo");
    } catch (e) {
      console.error("⚠️ Redis offline, modo persistencia simple");
    }
  }
};
initRedis();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// --- HELPER: AURUM BRIDGE SENDER ---
const sendBridgeEvent = async (tenant, eventType, payload) => {
  if (!tenant.bridge_enabled || !tenant.bridge_webhook_url) return;
  try {
    await axios.post(tenant.bridge_webhook_url, {
      ...payload,
      eventType,
      businessId: `${tenant.subdomain.toUpperCase()}_NODE_${tenant.bridge_satellite_id || '3'}`,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'x-api-key': tenant.bridge_api_key,
        'x-satellite-id': tenant.bridge_satellite_id || '3'
      },
      timeout: 5000
    });
    await pool.query("INSERT INTO integration_logs (platform, event_type, status, response, tenant_id) VALUES ('AURUM_BRIDGE', $1, 'SUCCESS', 'Handshake OK', $2)", [eventType, tenant.id]);
  } catch (error) {
    await pool.query("INSERT INTO integration_logs (platform, event_type, status, response, tenant_id) VALUES ('AURUM_BRIDGE', $1, 'FAILED', $2, $3)", [eventType, error.message, tenant.id]);
  }
};

// --- INICIALIZACIÓN Y SEEDING ---
const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // 1. Crear Tablas base
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        subdomain VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        bridge_enabled BOOLEAN DEFAULT FALSE,
        bridge_webhook_url TEXT,
        bridge_api_key UUID DEFAULT gen_random_uuid(),
        bridge_satellite_id INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'ADMIN',
        tenant_id UUID REFERENCES tenants(id),
        UNIQUE(phone, tenant_id)
      );
    `);

    await client.query(`CREATE TABLE IF NOT EXISTS integration_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), platform VARCHAR(50), event_type VARCHAR(100), status VARCHAR(50), response TEXT, tenant_id UUID REFERENCES tenants(id), created_at TIMESTAMP DEFAULT NOW());`);
    await client.query(`CREATE TABLE IF NOT EXISTS settings (key VARCHAR(100) NOT NULL, value JSONB NOT NULL, tenant_id UUID REFERENCES tenants(id), PRIMARY KEY (key, tenant_id));`);
    await client.query(`CREATE TABLE IF NOT EXISTS professionals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, role VARCHAR(100), email VARCHAR(255), aurum_employee_id VARCHAR(50), tenant_id UUID REFERENCES tenants(id));`);

    // 2. SEEDING: Crear Nodo Master y SuperAdmin si no existen
    const tenantCheck = await client.query("SELECT id FROM tenants WHERE subdomain = 'master' LIMIT 1");
    if (tenantCheck.rows.length === 0) {
      console.log("🌱 Sembrando Nodo Maestro de Infraestructura...");
      const masterRes = await client.query(
        "INSERT INTO tenants (name, subdomain, status, bridge_enabled) VALUES ('Aurum Global Nexus', 'master', 'ACTIVE', TRUE) RETURNING id"
      );
      const masterId = masterRes.rows[0].id;

      // Crear SuperAdmin Global
      await client.query(
        "INSERT INTO users (name, phone, password, role, tenant_id) VALUES ('Nexus Command', '8888', crypt('aurum2026', gen_salt('bf')), 'SUPERADMIN', $1)",
        [masterId]
      );

      // Crear Nodo Shula para pruebas
      const shulaRes = await client.query(
        "INSERT INTO tenants (name, subdomain, status) VALUES ('Shula Studio', 'shula', 'ACTIVE') RETURNING id"
      );
      const shulaId = shulaRes.rows[0].id;

      await client.query(
        "INSERT INTO users (name, phone, password, role, tenant_id) VALUES ('Shula Admin', '5571427321', crypt('shula123', gen_salt('bf')), 'ADMIN', $1)",
        [shulaId]
      );

      // Default Settings
      await client.query(
        "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2)",
        [JSON.stringify({ businessName: 'Shula Studio', primaryColor: '#D4AF37' }), shulaId]
      );
    }

    await client.query('COMMIT');
    console.log("✅ Infraestructura Aurum lista y sincronizada.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Error de despliegue:", e);
  } finally {
    client.release();
  }
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- MIDDLEWARES ---
const tenantMiddleware = async (req, res, next) => {
  const host = req.headers.host || '';
  try {
    const subdomain = (host.startsWith('localhost') || host === ROOT_DOMAIN) ? 'master' : host.split('.')[0];
    const result = await pool.query("SELECT * FROM tenants WHERE subdomain = $1 LIMIT 1", [subdomain]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Nodo no encontrado" });
    req.tenant = result.rows[0];
    next();
  } catch (e) { res.status(500).json({ error: "Falla de red" }); }
};

// --- LOGIN CON VALIDACIÓN CRYPT ---
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
      res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, phone: user.phone, tenantId: user.tenant_id } });
    } else {
      res.status(401).json({ success: false, error: "Credenciales inválidas en este nodo." });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RESTO DE ENDPOINTS
app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'landing' AND tenant_id = $1", [req.tenant.id]);
    res.json({ 
        ...(result.rows[0]?.value || {}), 
        subdomain: req.tenant.subdomain,
        bridge: {
            enabled: req.tenant.bridge_enabled,
            webhookUrl: req.tenant.bridge_webhook_url,
            apiKey: req.tenant.bridge_api_key,
            satelliteId: req.tenant.bridge_satellite_id
        }
    });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 CitaPlanner Ecosystem operativo en puerto ${PORT}`));
});
