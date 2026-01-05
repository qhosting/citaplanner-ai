
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

// --- CONFIGURACIÓN DE ALMACENAMIENTO ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `AUM-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/citaplanner_prod';
const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MIDDLEWARE DE AISLAMIENTO SAAS ---
const tenantMiddleware = async (req, res, next) => {
  const host = req.headers.host || '';
  let tenant = null;

  try {
    // Soporte para localhost con o sin puerto, y dominios raíz
    const isRoot = host.startsWith('localhost') || 
                   host === 'citaplanner.com' || 
                   host === 'www.citaplanner.com' ||
                   host.includes('127.0.0.1');

    if (isRoot) {
      const result = await pool.query("SELECT * FROM tenants WHERE subdomain = 'master' LIMIT 1");
      tenant = result.rows[0];
    } else {
      const subdomain = host.split('.')[0];
      const result = await pool.query("SELECT * FROM tenants WHERE subdomain = $1 LIMIT 1", [subdomain]);
      tenant = result.rows[0];
    }

    if (!tenant) return res.status(404).json({ error: "Nodo CitaPlanner no detectado para el host: " + host });
    req.tenant = tenant;
    next();
  } catch (e) {
    console.error('Tenant Identification Error:', e);
    res.status(500).json({ error: "Falla en protocolo de identificación de infraestructura." });
  }
};

// --- ENDPOINTS PARA MODO DIOS (SUPERADMIN) ---

// Listar todos los tenants del ecosistema
app.get('/api/saas/tenants', tenantMiddleware, async (req, res) => {
  if (req.tenant.subdomain !== 'master') return res.status(403).json({ error: "Privilegios insuficientes" });
  const result = await pool.query("SELECT * FROM tenants ORDER BY created_at DESC");
  res.json(result.rows);
});

// Métricas globales de la infraestructura
app.get('/api/saas/stats', tenantMiddleware, async (req, res) => {
  if (req.tenant.subdomain !== 'master') return res.status(403).json({ error: "Privilegios insuficientes" });
  
  const revenueRes = await pool.query("SELECT SUM(total) as revenue FROM sales");
  const usersRes = await pool.query("SELECT COUNT(*) as count FROM users");
  const tenantsRes = await pool.query("SELECT COUNT(*) as count FROM tenants");

  res.json({
    totalRevenue: parseFloat(revenueRes.rows[0]?.revenue || 0),
    totalUsers: parseInt(usersRes.rows[0]?.count || 0),
    totalTenants: parseInt(tenantsRes.rows[0]?.count || 0)
  });
});

// Bloquear/Activar un nodo desde el Nexus
app.put('/api/saas/tenants/:id/status', tenantMiddleware, async (req, res) => {
  if (req.tenant.subdomain !== 'master') return res.status(403).json({ error: "Privilegios insuficientes" });
  const { status } = req.body;
  await pool.query("UPDATE tenants SET status = $1 WHERE id = $2", [status, req.params.id]);
  res.json({ success: true });
});

// --- CONTINUACIÓN ENDPOINTS ADMIN ESTÁNDAR ---
app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT value FROM settings WHERE key = 'landing' AND tenant_id = $1", [req.tenant.id]);
  res.json(result.rows[0]?.value || { businessName: req.tenant.name, primaryColor: '#C5A028' });
});

app.put('/api/settings/landing', tenantMiddleware, async (req, res) => {
  await pool.query(
    "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2) ON CONFLICT (key, tenant_id) DO UPDATE SET value = $1",
    [req.body, req.tenant.id]
  );
  res.json({ success: true });
});

app.get('/api/clients', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM clients WHERE tenant_id = $1 ORDER BY name ASC", [req.tenant.id]);
  res.json(result.rows.map(c => ({ ...c, treatmentHistory: c.treatment_history || [] })));
});

app.post('/api/clients', tenantMiddleware, async (req, res) => {
  const { name, phone, email, notes, skinType, allergies, medicalConditions } = req.body;
  const result = await pool.query(
    "INSERT INTO clients (name, phone, email, notes, skin_type, allergies, medical_conditions, tenant_id, treatment_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '[]') RETURNING *",
    [name, phone, email, notes, skinType, allergies, medicalConditions, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.put('/api/clients/:id', tenantMiddleware, async (req, res) => {
  const { name, phone, email, notes, skinType, allergies, medicalConditions, consentAccepted, consentDate, consentType, treatmentHistory } = req.body;
  await pool.query(
    "UPDATE clients SET name=$1, phone=$2, email=$3, notes=$4, skin_type=$5, allergies=$6, medical_conditions=$7, consent_accepted=$8, consent_date=$9, consent_type=$10, treatment_history=$11 WHERE id=$12 AND tenant_id=$13",
    [name, phone, email, notes, skinType, allergies, medicalConditions, consentAccepted, consentDate, consentType, JSON.stringify(treatmentHistory), req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.get('/api/professionals', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM professionals WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows.map(p => ({ 
    ...p, 
    weeklySchedule: p.weekly_schedule || [], 
    exceptions: p.exceptions || [] 
  })));
});

app.post('/api/professionals', tenantMiddleware, async (req, res) => {
  const { name, role, email, weeklySchedule, exceptions } = req.body;
  const result = await pool.query(
    "INSERT INTO professionals (name, role, email, weekly_schedule, exceptions, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [name, role, email, JSON.stringify(weeklySchedule), JSON.stringify(exceptions), req.tenant.id]
  );
  res.json({ success: true, id: result.rows[0].id });
});

app.put('/api/professionals/:id', tenantMiddleware, async (req, res) => {
  const { name, role, email, weeklySchedule, exceptions } = req.body;
  await pool.query(
    "UPDATE professionals SET name=$1, role=$2, email=$3, weekly_schedule=$4, exceptions=$5 WHERE id=$6 AND tenant_id=$7",
    [name, role, email, JSON.stringify(weeklySchedule), JSON.stringify(exceptions), req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.get('/api/products', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM products WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/products', tenantMiddleware, async (req, res) => {
  const { name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate } = req.body;
  await pool.query(
    "INSERT INTO products (name, sku, category, price, cost, stock, min_stock, status, usage, batch_number, expiry_date, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
    [name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate, req.tenant.id]
  );
  res.json({ success: true });
});

app.post('/api/upload', tenantMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

app.post('/api/sales', tenantMiddleware, async (req, res) => {
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

app.get('/api/analytics/stats', tenantMiddleware, async (req, res) => {
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

const initDB = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        subdomain VARCHAR(50) UNIQUE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        plan_type VARCHAR(20) DEFAULT 'PRO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS professionals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, role TEXT, email TEXT, weekly_schedule JSONB, exceptions JSONB, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS sales (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sale_id TEXT, items JSONB, total DECIMAL, payment_method TEXT, client_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS inventory_movements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id TEXT, product_name TEXT, type TEXT, quantity INTEGER, reason TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, tenant_id UUID REFERENCES tenants(id));
      
      -- Asegurar existencia del nodo master
      INSERT INTO tenants (name, subdomain, status, plan_type) 
      VALUES ('Citaplanner Nexus', 'master', 'ACTIVE', 'ELITE')
      ON CONFLICT (subdomain) DO NOTHING;
    `);
    console.log("✅ Ecosistema Nexus Online & DB Initialized.");
  } catch (e) { console.error('❌ Init Error:', e.message); }
};

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 SaaS Master Engine en puerto ${PORT}`));
});
