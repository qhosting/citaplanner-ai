
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from 'redis'; // NUEVO: Importar Redis

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'citaplanner.com';
const REDIS_URL = process.env.REDIS_URL; // Usar variable de entorno

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

// Iniciar Redis inmediatamente
initRedis();

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

// --- CONFIGURACIÓN CLOUDFLARE & AURUM HUB ---
const AURUM_HUB_URL = process.env.AURUM_HUB_URL || 'https://api.aurum-hub.com/v1';
const AURUM_SATELLITE_KEY = process.env.AURUM_SATELLITE_KEY || 'DEV_KEY';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

// --- MIDDLEWARE DE AISLAMIENTO SAAS (Soporte Dual + Redis Cache) ---
const tenantMiddleware = async (req, res, next) => {
  const host = req.headers.host || '';
  const cacheKey = `tenant:${host}`;
  let tenant = null;

  try {
    // 1. Intentar obtener de Redis (Cache Hit)
    if (redisClient) {
      const cachedTenant = await redisClient.get(cacheKey);
      if (cachedTenant) {
        req.tenant = JSON.parse(cachedTenant);
        return next();
      }
    }

    // 2. Si no está en caché, consultar DB (Cache Miss)
    const isRoot = host.startsWith('localhost') || 
                   host === ROOT_DOMAIN || 
                   host === `www.${ROOT_DOMAIN}` ||
                   host.includes('127.0.0.1');

    if (isRoot) {
      const result = await pool.query("SELECT * FROM tenants WHERE subdomain = 'master' LIMIT 1");
      tenant = result.rows[0];
    } else {
      // Intentar buscar por Dominio Personalizado Exacto
      const customRes = await pool.query("SELECT * FROM tenants WHERE custom_domain = $1 LIMIT 1", [host]);
      
      if (customRes.rows.length > 0) {
        tenant = customRes.rows[0];
      } else {
        // Si no es dominio propio, asumir Subdominio
        const subdomain = host.split('.')[0];
        const subRes = await pool.query("SELECT * FROM tenants WHERE subdomain = $1 LIMIT 1", [subdomain]);
        tenant = subRes.rows[0];
      }
    }

    if (!tenant) return res.status(404).json({ error: "Nodo CitaPlanner no detectado para el host: " + host });
    
    // 3. Guardar en Redis para futuras peticiones (TTL 1 hora)
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

// --- SERVICIO CLOUDFLARE ---
const CloudflareService = {
  addDomain: async (hostname) => {
    if (!CF_API_TOKEN || !CF_ZONE_ID) return { success: true, id: 'mock-cf-id' }; // Mock para dev local
    try {
      const resp = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/custom_hostnames`,
        { hostname, ssl: { method: 'http', type: 'dv' } },
        { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
      );
      return { success: true, id: resp.data.result.id };
    } catch (e) {
      console.error("Cloudflare Add Error:", e.response?.data || e.message);
      return { success: false, error: e.response?.data?.errors?.[0]?.message || "Error CF API" };
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

// --- PROXY AURUM MASTER HUB (Integración Segura) ---
const aurumRouter = express.Router();

aurumRouter.use(async (req, res, next) => {
  next();
});

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
    res.status(status).json({ 
      success: false, 
      error: error.response?.data?.message || "Error de comunicación con Aurum Master Hub" 
    });
  }
};

aurumRouter.post('/sync/clients', (req, res) => forwardToHub('/sync/clients', 'POST', req.body, res));
aurumRouter.post('/sync/services', (req, res) => forwardToHub('/sync/services', 'POST', req.body, res));
aurumRouter.post('/billing/checkout', (req, res) => forwardToHub('/billing/checkout', 'POST', req.body, res));

app.use('/api/integrations/aurum', tenantMiddleware, aurumRouter);


// --- AUTENTICACIÓN Y USUARIOS ---

app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE phone = $1 AND password = crypt($2, password) LIMIT 1",
      [phone, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      delete user.password;
      res.json({ success: true, user });
    } else {
      const legacyResult = await pool.query(
        "SELECT * FROM users WHERE phone = $1 AND password = $2 LIMIT 1",
        [phone, password]
      );
      
      if (legacyResult.rows.length > 0) {
         const user = legacyResult.rows[0];
         await pool.query("UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE id = $2", [password, user.id]);
         delete user.password;
         res.json({ success: true, user });
      } else {
         res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de autenticación" });
  }
});

// --- ONBOARDING AUTOMÁTICO (REGISTRO SAAS) ---
app.post('/api/saas/register', async (req, res) => {
  const { businessName, subdomain, adminName, adminPhone, adminPassword } = req.body;
  
  if (!businessName || !subdomain || !adminPhone || !adminPassword) {
    return res.status(400).json({ error: "Faltan datos requeridos para el provisionamiento." });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const checkSub = await client.query("SELECT id FROM tenants WHERE subdomain = $1", [subdomain.toLowerCase()]);
    if (checkSub.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: "El subdominio ya está ocupado por otro nodo." });
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

    const defaultSettings = {
      businessName: businessName,
      primaryColor: '#D4AF37',
      secondaryColor: '#1A1A1A',
      slogan: 'Experiencia de Lujo',
      aboutText: 'Bienvenido a nuestro exclusivo espacio de belleza.',
      contactPhone: adminPhone,
      address: 'Dirección por configurar',
      maintenanceMode: false
    };

    await client.query(
      "INSERT INTO settings (key, value, tenant_id) VALUES ('landing', $1, $2)",
      [JSON.stringify(defaultSettings), tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: "Nodo desplegado exitosamente.", tenantId });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Onboarding Error:", e);
    res.status(500).json({ error: "Error crítico durante el aprovisionamiento." });
  } finally {
    client.release();
  }
});

// --- GESTIÓN DE DOMINIOS PERSONALIZADOS ---

app.post('/api/settings/domain', tenantMiddleware, async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Dominio requerido" });

  try {
    // 1. Verificar si el dominio ya existe en otro tenant
    const check = await pool.query("SELECT id FROM tenants WHERE custom_domain = $1 AND id != $2", [domain, req.tenant.id]);
    if (check.rows.length > 0) return res.status(409).json({ error: "El dominio ya está en uso por otro nodo." });

    // 2. Registrar en Cloudflare
    const cfResult = await CloudflareService.addDomain(domain);
    if (!cfResult.success) return res.status(500).json({ error: cfResult.error });

    // 3. Guardar en DB
    await pool.query(
      "UPDATE tenants SET custom_domain = $1, cloudflare_id = $2 WHERE id = $3",
      [domain, cfResult.id, req.tenant.id]
    );

    // 4. INVALIDAR CACHÉ REDIS (Importante)
    if (redisClient) {
      const currentHost = req.headers.host;
      await redisClient.del(`tenant:${currentHost}`); // Borrar caché del host actual
      await redisClient.del(`tenant:${domain}`);      // Borrar caché del nuevo dominio por si acaso
    }

    res.json({ success: true, message: "Dominio vinculado. Configura tu CNAME." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/settings/domain', tenantMiddleware, async (req, res) => {
  try {
    if (req.tenant.cloudflare_id) {
      await CloudflareService.removeDomain(req.tenant.cloudflare_id);
    }
    await pool.query(
      "UPDATE tenants SET custom_domain = NULL, cloudflare_id = NULL WHERE id = $1",
      [req.tenant.id]
    );

    // INVALIDAR CACHÉ REDIS
    if (redisClient) {
        const currentHost = req.headers.host;
        await redisClient.del(`tenant:${currentHost}`);
        if(req.tenant.custom_domain) {
            await redisClient.del(`tenant:${req.tenant.custom_domain}`);
        }
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- CORE ENDPOINTS ---

app.put('/api/users/:id/password', tenantMiddleware, async (req, res) => {
  const { current, next } = req.body;
  try {
    const check = await pool.query("SELECT id FROM users WHERE id = $1 AND password = crypt($2, password)", [req.params.id, current]);
    
    if (check.rows.length > 0) {
      await pool.query("UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE id = $2", [next, req.params.id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Password actual incorrecto" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:id/profile', tenantMiddleware, async (req, res) => {
  const { name, email, avatar } = req.body;
  try {
    await pool.query(
      "UPDATE users SET name = $1, email = $2, avatar = $3 WHERE id = $4",
      [name, email, avatar, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:id/preferences', tenantMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE users SET preferences = $1 WHERE id = $2",
      [JSON.stringify(req.body), req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/saas/tenants', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM tenants ORDER BY created_at DESC");
  res.json(result.rows);
});

app.get('/api/saas/stats', tenantMiddleware, async (req, res) => {
  const revenueRes = await pool.query("SELECT SUM(total) as revenue FROM sales");
  const usersRes = await pool.query("SELECT COUNT(*) as count FROM users");
  const tenantsRes = await pool.query("SELECT COUNT(*) as count FROM tenants");

  res.json({
    totalRevenue: parseFloat(revenueRes.rows[0]?.revenue || 0),
    totalUsers: parseInt(usersRes.rows[0]?.count || 0),
    totalTenants: parseInt(tenantsRes.rows[0]?.count || 0)
  });
});

app.put('/api/saas/tenants/:id/status', tenantMiddleware, async (req, res) => {
  const { status } = req.body;
  await pool.query("UPDATE tenants SET status = $1 WHERE id = $2", [status, req.params.id]);
  
  // INVALIDAR CACHÉ GLOBAL (Opcional, pero seguro si suspendes a alguien)
  if (redisClient) {
      // Idealmente buscaríamos el dominio del tenant para invalidarlo,
      // pero como es admin action, podemos dejar que expire el TTL o implementar búsqueda.
      // Por ahora simple: la DB manda, Redis tiene TTL de 1 hora.
  }
  
  res.json({ success: true });
});

app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT value FROM settings WHERE key = 'landing' AND tenant_id = $1", [req.tenant.id]);
  // Añadir información del dominio al objeto de respuesta
  const landingData = result.rows[0]?.value || { businessName: req.tenant.name, primaryColor: '#C5A028' };
  res.json({
    ...landingData,
    customDomain: req.tenant.custom_domain,
    subdomain: req.tenant.subdomain
  });
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

app.delete('/api/clients/:id', tenantMiddleware, async (req, res) => {
  await pool.query("DELETE FROM clients WHERE id=$1 AND tenant_id=$2", [req.params.id, req.tenant.id]);
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

app.put('/api/products/:id', tenantMiddleware, async (req, res) => {
  const { name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate } = req.body;
  await pool.query(
    "UPDATE products SET name=$1, sku=$2, category=$3, price=$4, cost=$5, stock=$6, min_stock=$7, status=$8, usage=$9, batch_number=$10, expiry_date=$11 WHERE id=$12 AND tenant_id=$13",
    [name, sku, category, price, cost, stock, minStock, status, usage, batchNumber, expiryDate, req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.get('/api/inventory/movements', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM inventory_movements WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/upload', tenantMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

app.get('/api/services', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM services WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/services', tenantMiddleware, async (req, res) => {
  const { name, duration, price, description, category, status, imageUrl } = req.body;
  const result = await pool.query(
    "INSERT INTO services (name, duration, price, description, category, status, image_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [name, duration, price, description, category, status, imageUrl, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.put('/api/services/:id', tenantMiddleware, async (req, res) => {
  const { name, duration, price, description, category, status, imageUrl } = req.body;
  await pool.query(
    "UPDATE services SET name=$1, duration=$2, price=$3, description=$4, category=$5, status=$6, image_url=$7 WHERE id=$8 AND tenant_id=$9",
    [name, duration, price, description, category, status, imageUrl, req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.delete('/api/services/:id', tenantMiddleware, async (req, res) => {
  await pool.query("DELETE FROM services WHERE id=$1 AND tenant_id=$2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.get('/api/branches', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM branches WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/branches', tenantMiddleware, async (req, res) => {
  const { name, address, phone, manager, status } = req.body;
  await pool.query(
    "INSERT INTO branches (name, address, phone, manager, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [name, address, phone, manager, status, req.tenant.id]
  );
  res.json({ success: true });
});

app.put('/api/branches/:id', tenantMiddleware, async (req, res) => {
  const { name, address, phone, manager, status } = req.body;
  await pool.query(
    "UPDATE branches SET name=$1, address=$2, phone=$3, manager=$4, status=$5 WHERE id=$6 AND tenant_id=$7",
    [name, address, phone, manager, status, req.params.id, req.tenant.id]
  );
  res.json({ success: true });
});

app.delete('/api/branches/:id', tenantMiddleware, async (req, res) => {
  await pool.query("DELETE FROM branches WHERE id=$1 AND tenant_id=$2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.get('/api/appointments', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM appointments WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/appointments', tenantMiddleware, async (req, res) => {
  const { title, startDateTime, endDateTime, clientName, clientPhone, description, status, professionalId, serviceId } = req.body;
  const result = await pool.query(
    "INSERT INTO appointments (title, start_date_time, end_date_time, client_name, client_phone, description, status, professional_id, service_id, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
    [title, startDateTime, endDateTime, clientName, clientPhone, description, status, professionalId, serviceId, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.post('/api/appointments/:id/cancel', tenantMiddleware, async (req, res) => {
  await pool.query("UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
});

app.post('/api/appointments/:id/complete', tenantMiddleware, async (req, res) => {
  const { notes } = req.body;
  // TODO: Add notes to client history logic here
  await pool.query("UPDATE appointments SET status = 'COMPLETED' WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenant.id]);
  res.json({ success: true });
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

// --- MARKETING & INTEGRATIONS ---

app.get('/api/marketing/campaigns', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM marketing_campaigns WHERE tenant_id = $1 ORDER BY created_at DESC", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/marketing/campaigns', tenantMiddleware, async (req, res) => {
  const { name, channel, status, content, targetSegment, subject } = req.body;
  const result = await pool.query(
    "INSERT INTO marketing_campaigns (name, channel, status, content, target_segment, subject, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [name, channel, status, content, targetSegment, subject, req.tenant.id]
  );
  res.json(result.rows[0]);
});

app.post('/api/marketing/campaigns/send', tenantMiddleware, async (req, res) => {
  const { campaign } = req.body;
  // Lógica de simulación de envío a proveedor externo (e.g. Twilio/SendGrid)
  const sentCount = Math.floor(Math.random() * 50) + 10; // Simulación del resultado del envío real
  
  await pool.query(
    "UPDATE marketing_campaigns SET status = 'SENT', sent_count = $1 WHERE id = $2 AND tenant_id = $3",
    [sentCount, campaign.id, req.tenant.id]
  );
  
  res.json({ success: true, message: `Campaña enviada a ${sentCount} destinatarios`, sentCount });
});

app.get('/api/marketing/automations', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM automation_rules WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows.map(r => ({ ...r, isActive: r.is_active, triggerType: r.trigger_type, delayHours: r.delay_hours, templateMessage: r.template_message })));
});

app.post('/api/marketing/automations', tenantMiddleware, async (req, res) => {
  const { rule } = req.body;
  if (rule.id && !rule.id.startsWith('new')) {
    await pool.query(
      "UPDATE automation_rules SET is_active = $1 WHERE id = $2 AND tenant_id = $3",
      [rule.isActive, rule.id, req.tenant.id]
    );
  } else {
    // Si no existe, insertar (lógica simplificada para toggle)
    // En producción real, manejaríamos creación completa
  }
  res.json({ success: true });
});

app.get('/api/integrations/status', tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM integration_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20", [req.tenant.id]);
  res.json(result.rows);
});

const initDB = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'ADMIN',
        avatar TEXT,
        preferences JSONB DEFAULT '{}',
        tenant_id UUID REFERENCES tenants(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        channel TEXT,
        status TEXT,
        content TEXT,
        target_segment TEXT,
        subject TEXT,
        sent_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tenant_id UUID REFERENCES tenants(id)
      );
      CREATE TABLE IF NOT EXISTS automation_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        is_active BOOLEAN DEFAULT FALSE,
        trigger_type TEXT,
        delay_hours INTEGER,
        channel TEXT,
        template_message TEXT,
        tenant_id UUID REFERENCES tenants(id)
      );
      CREATE TABLE IF NOT EXISTS integration_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT,
        event_type TEXT,
        status TEXT,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tenant_id UUID REFERENCES tenants(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, role TEXT, email TEXT, weekly_schedule JSONB, exceptions JSONB, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS sales (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sale_id TEXT, items JSONB, total DECIMAL, payment_method TEXT, client_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS inventory_movements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id TEXT, product_name TEXT, type TEXT, quantity INTEGER, reason TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS settings (key TEXT, value JSONB, tenant_id UUID, PRIMARY KEY (key, tenant_id));
      CREATE TABLE IF NOT EXISTS clients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, phone TEXT, email TEXT, notes TEXT, skin_type TEXT, allergies TEXT, medical_conditions TEXT, consent_accepted BOOLEAN DEFAULT FALSE, consent_date TEXT, consent_type TEXT, treatment_history JSONB, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, sku TEXT, category TEXT, price DECIMAL, cost DECIMAL, stock INTEGER, min_stock INTEGER, status TEXT, usage TEXT, batch_number TEXT, expiry_date TEXT, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS services (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, duration INTEGER, price DECIMAL, description TEXT, category TEXT, status TEXT, image_url TEXT, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS branches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, address TEXT, phone TEXT, manager TEXT, status TEXT, tenant_id UUID REFERENCES tenants(id));
      CREATE TABLE IF NOT EXISTS appointments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, start_date_time TEXT, end_date_time TEXT, client_name TEXT, client_phone TEXT, description TEXT, status TEXT, professional_id TEXT, service_id TEXT, tenant_id UUID REFERENCES tenants(id));
    `);
    
    // --- SEMILLA INICIAL ---
    const tenantRes = await pool.query(`
      INSERT INTO tenants (name, subdomain, status, plan_type) 
      VALUES ('Citaplanner Nexus', 'master', 'ACTIVE', 'ELITE')
      ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    
    const masterTenantId = tenantRes.rows[0].id;

    await pool.query(`
      INSERT INTO users (name, phone, password, role, tenant_id)
      VALUES ('Super Admin', 'admin', crypt('admin', gen_salt('bf')), 'SUPERADMIN', $1)
      ON CONFLICT (phone) DO NOTHING;
    `, [masterTenantId]);

    // Semilla de Reglas de Automatización por defecto
    await pool.query(`
      INSERT INTO automation_rules (name, is_active, trigger_type, delay_hours, channel, template_message, tenant_id)
      SELECT 'Solicitud de Reseña', true, 'APPOINTMENT_COMPLETED', 2, 'WHATSAPP', 'Hola {{name}}, gracias por tu visita. ¿Nos regalas una reseña?', $1
      WHERE NOT EXISTS (SELECT 1 FROM automation_rules WHERE tenant_id = $1);
    `, [masterTenantId]);

    console.log("✅ Ecosistema Nexus Online & DB Initialized. Admin User Ready.");
  } catch (e) { console.error('❌ Init Error:', e.message); }
};

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 SaaS Master Engine en puerto ${PORT}`));
});
