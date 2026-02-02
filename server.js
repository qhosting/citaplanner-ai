
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import nodemailer from 'nodemailer';
import webPush from 'web-push';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'citaplanner.com').toLowerCase();
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'aum-core-secure-2026-fix';

// --- OPTIMIZACIÓN: CACHÉ DE TENANTS ---
const tenantCache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

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

// --- DATABASE & REDIS SETUP ---

// Mercado Pago Client
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000'
});

// Web Push Configuration
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BFxL8_...GenerateMe...',
    privateKey: process.env.VAPID_PRIVATE_KEY || '...GenerateMe...'
};

if (!process.env.VAPID_PUBLIC_KEY) {
    const keys = webPush.generateVAPIDKeys();
    vapidKeys.publicKey = keys.publicKey;
    vapidKeys.privateKey = keys.privateKey;
    console.log("🔑 Generated VAPID Keys (Add to .env for persistence):");
    console.log("Public:", keys.publicKey);
    console.log("Private:", keys.privateKey);
}

webPush.setVapidDetails(
    'mailto:admin@aurum.ai',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/citaplanner_dev';

const pool = new Pool({ 
  connectionString: connectionString,
  ssl: connectionString.includes('sslmode=disable') || !process.env.DATABASE_URL ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, 
  statement_timeout: 10000
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('⚠️ Redis Client Error', err));

const connectRedis = async () => {
    if (process.env.REDIS_URL || process.env.NODE_ENV === 'development') {
        try {
            await redisClient.connect();
            console.log("✅ Redis Connected");
        } catch (e) {
            console.warn("⚠️ Redis Connection Failed (Caching Disabled):", e.message);
        }
    }
};

const getCached = async (key, fetchFn, ttl = 300) => {
    if (!redisClient.isOpen) return fetchFn();
    try {
        const cached = await redisClient.get(key);
        if (cached) return JSON.parse(cached);
        const data = await fetchFn();
        if (data) await redisClient.setEx(key, ttl, JSON.stringify(data));
        return data;
    } catch (e) {
        console.warn(`Cache Error for ${key}:`, e.message);
        return fetchFn();
    }
};

const sendWhatsAppMessage = async (phone, text, branchId) => {
    if (!phone) return;
    try {
        // WAHA requires formatted phone numbers (e.g. 52155...)
        // This is a simplified implementation
        const chatId = `${phone.replace(/\D/g, '')}@c.us`;

        console.log(`📨 Sending WhatsApp to ${chatId}: ${text}`);

        await axios.post(`${WAHA_URL}/api/sendText`, {
            chatId: chatId,
            text: text,
            session: 'default'
        });

        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, payload, response, status, branch_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['WHATSAPP', 'SEND_MESSAGE', JSON.stringify({ chatId, text }), 'Sent', 'SUCCESS', branchId]
        );
    } catch (e) {
        console.error('❌ WhatsApp Send Error:', e.message);
        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, payload, response, status, branch_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['WHATSAPP', 'SEND_ERROR', JSON.stringify({ phone, text }), e.message, 'ERROR', branchId]
        );
    }
};

// Email Transporter
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'demo@aurum.ai',
        pass: process.env.SMTP_PASS || 'demo123'
    }
});

const sendEmail = async (to, subject, html, branchId) => {
    try {
        if (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'production') {
            console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            return true; // Simulate success if no config
        }
        await emailTransporter.sendMail({
            from: process.env.SMTP_FROM || '"Aurum CitaPlanner" <no-reply@aurum.ai>',
            to,
            subject,
            html
        });
        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, payload, response, status, branch_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['EMAIL', 'SEND_MESSAGE', JSON.stringify({ to, subject }), 'Sent', 'SUCCESS', branchId]
        );
        return true;
    } catch (e) {
        console.error('❌ Email Send Error:', e.message);
        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, payload, response, status, branch_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['EMAIL', 'SEND_ERROR', JSON.stringify({ to, subject }), e.message, 'ERROR', branchId]
        );
        return false;
    }
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(50) DEFAULT 'demo',
        name VARCHAR(100) NOT NULL,
        subdomain VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        plan_type VARCHAR(20) DEFAULT 'ELITE',
        features JSONB DEFAULT '{"ai_scheduler": true, "marketing_pro": true, "inventory_advanced": true, "analytics_nexus": true}',
        bridge_enabled BOOLEAN DEFAULT FALSE,
        bridge_webhook_url TEXT,
        bridge_api_key UUID DEFAULT gen_random_uuid(),
        bridge_satellite_id INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(100),
        password VARCHAR(100),
        role VARCHAR(20),
        related_id VARCHAR(100),
        branch_id UUID,
        preferences JSONB DEFAULT '{}',
        push_subscription JSONB,
        skin_type VARCHAR(100),
        allergies TEXT,
        medical_conditions TEXT,
        loyalty_points INT DEFAULT 0,
        avatar TEXT,
        loyalty_points INTEGER DEFAULT 0
      );

    // Ensure column exists for existing DBs
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB'); } catch (e) {}

    await client.query(`
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

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants (subdomain);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_tenant ON users (phone, tenant_id);
    `);

    const masterIdRes = await client.query(`
      INSERT INTO tenants (name, subdomain, status, plan_type) 
      VALUES ('Aurum Global Nexus', 'master', 'ACTIVE', 'LEGACY') 
      ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name 
      RETURNING id
    `);
    
    const masterId = masterIdRes.rows[0].id;

    await client.query(`
      CREATE TABLE IF NOT EXISTS landing_settings (
        id INT PRIMARY KEY DEFAULT 1,
        business_name VARCHAR(100) DEFAULT 'CitaPlanner Elite',
        primary_color VARCHAR(20) DEFAULT '#630E14',
        secondary_color VARCHAR(20) DEFAULT '#C5A028',
        template_id VARCHAR(20) DEFAULT 'citaplanner',
        slogan TEXT,
        about_text TEXT,
        address TEXT,
        contact_phone VARCHAR(20),
        hero_image_url TEXT
      );
    `);

    const settingsCheck = await client.query("SELECT id FROM landing_settings WHERE id = 1");
    if (settingsCheck.rowCount === 0) {
        await client.query(`
          INSERT INTO landing_settings (id, business_name, primary_color, secondary_color, template_id, slogan, about_text, address, contact_phone)
          VALUES (1, 'CitaPlanner Elite', '#630E14', '#C5A028', 'citaplanner', 'Gestión de Lujo Simplificada', 'Plataforma líder en gestión de citas y negocios de belleza.', 'Av. Principal 123, CDMX', '+52 55 1234 5678');
        `);
    }

    // --- MIGRATIONS (Run AFTER tables are created) ---
    const runMigration = async (query) => {
        try { await client.query(query); } catch (e) { /* Ignore if fails (e.g. column exists) or log debug */ }
    };

    // STRICT MULTI-TENANCY COLUMNS
    await runMigration(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);

    // Add organization_id to ALL tables for isolation
    await runMigration(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE services ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
    await runMigration(`ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"ai": true, "inventory": true, "marketing": true}'`);

    await runMigration(`ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID`);
    await runMigration(`ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB`);
    await runMigration(`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS branch_id UUID`);
    await runMigration(`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS service_ids TEXT`);
    await runMigration(`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS weekly_schedule JSONB`);
    await runMigration(`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS exceptions JSONB`);
    await runMigration(`ALTER TABLE services ADD COLUMN IF NOT EXISTS branch_id UUID`);
    await runMigration(`ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID`);
    await runMigration(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID`);
    await runMigration(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS branch_id UUID`);
    await runMigration(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100)`);
    await runMigration(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mp_status VARCHAR(50)`);
    await runMigration(`ALTER TABLE integration_logs ADD COLUMN IF NOT EXISTS branch_id UUID`);

    // Seeding Services
    const serviceCount = await client.query("SELECT count(*) FROM services");
    if (parseInt(serviceCount.rows[0].count) === 0) {
        const servicesToSeed = [
          ['PESTAÑAS', 'TECNICA CLASICA', 550, 'NATURAL', 90],
          ['UÑAS', 'GEL SEMIPERMANENTE', 120, '1 TONO', 45]
        ];
        for (const s of servicesToSeed) {
            await client.query(
                "INSERT INTO services (category, name, price, description, duration, branch_id, status) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')",
                [s[0], s[1], s[2], s[3], s[4], defaultBranchId]
            );
        }
    }

    // Seeding Users
    const userCount = await client.query("SELECT count(*) FROM users");
    if (parseInt(userCount.rows[0].count) === 0) {
        // ADMIN with password '123'
        await client.query(`
            INSERT INTO users (name, phone, email, password, role, branch_id, preferences, organization_id)
            VALUES ('Admin Master', 'admin', 'admin@aurum.ai', '123', 'ADMIN', $1, '{"whatsapp":true,"email":true}', 'demo')
        `, [defaultBranchId]);

        // PRO
        const defaultSchedule = JSON.stringify([
            {dayOfWeek:1,isEnabled:true,slots:[{start:"09:00",end:"18:00"}]},
            {dayOfWeek:2,isEnabled:true,slots:[{start:"09:00",end:"18:00"}]},
            {dayOfWeek:3,isEnabled:true,slots:[{start:"09:00",end:"18:00"}]},
            {dayOfWeek:4,isEnabled:true,slots:[{start:"09:00",end:"18:00"}]},
            {dayOfWeek:5,isEnabled:true,slots:[{start:"09:00",end:"18:00"}]}
        ]);
        const proRes = await client.query(`
            INSERT INTO professionals (name, role, email, branch_id, weekly_schedule, exceptions, service_ids, organization_id)
            VALUES ('Dra. Ana Elite', 'Dermatología', 'ana@aurum.ai', $1, $2, '[]', '[]', 'demo')
            RETURNING id
        `, [defaultBranchId, defaultSchedule]);
        await client.query(`
            INSERT INTO users (name, phone, email, password, role, related_id, branch_id, organization_id)
            VALUES ('Dra. Ana Elite', 'pro', 'ana@aurum.ai', 'pro123', 'PROFESSIONAL', $1, $2, 'demo')
        `, [proRes.rows[0].id, defaultBranchId]);

        // CLIENT
        await client.query(`
            INSERT INTO users (name, phone, email, password, role, branch_id, skin_type, loyalty_points, organization_id)
            VALUES ('Valeria Gold', 'client', 'valeria@client.com', 'client123', 'CLIENT', $1, 'Fitzpatrick III', 150, 'demo')
        `, [defaultBranchId]);
    }

    await client.query('COMMIT');
    console.log("✅ Infraestructura Aurum Nexus v5.0 Operativa.");
  } catch (e) { 
    await client.query('ROLLBACK'); 
    console.error("❌ Error en initDB:", e.message); 
  } finally { 
    client.release(); 
  }
};

const tenantMiddleware = (req, res, next) => {
    // 1. Detect Tenant from Subdomain
    const host = req.headers.host || '';
    const parts = host.split('.');
    let tenantId = 'demo';

    // Check if subdomain exists (e.g. shula.citaplanner.com)
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'citaplanner') {
        tenantId = parts[0];
    } else {
        // Fallback to Header (Useful for dev/postman)
        tenantId = req.headers['x-tenant-id'] || 'demo';
    }

    req.tenantId = tenantId;
    req.branchId = req.headers['x-branch-id']; // Optional specific branch

    // Log context for debugging
    console.log(`[CTX] Tenant: ${tenantId} | Branch: ${req.branchId || 'ALL'}`);

    next();
  } catch (e) { 
    res.status(500).json({ error: "Falla de red" }); 
  }
};

app.use(tenantMiddleware);

const checkGodMode = (req, res, next) => {
  if (req.user.role !== 'GOD_MODE') return res.status(403).json({ error: "Privilegios insuficientes" });
  next();
};

// AURUM HUB INTEGRATION (PROXY)
app.post('/api/integrations/aurum/sync', async (req, res) => {
    // Stub for syncing business identity with Master Hub
    console.log(`[AURUM HUB] Syncing identity for tenant: ${req.tenantId}`);
    res.json({ success: true, status: 'SYNCED', hubId: `hub_${req.tenantId}` });
});

app.get('/api/integrations/aurum/status', async (req, res) => {
    // Stub for checking subscription status
    res.json({
        active: true,
        plan: 'ELITE_GOLD',
        features: { ai: true, inventory: true, marketing: true }
    });
});

app.get('/api/branches', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM branches WHERE organization_id = $1 ORDER BY created_at ASC", [req.tenantId]);
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/integrations/whatsapp/webhook', async (req, res) => {
    try {
        const data = req.body;
        // Basic logging
        console.log("🔔 WhatsApp Webhook:", JSON.stringify(data));
        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, payload, response, status, branch_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['WHATSAPP', 'WEBHOOK_RECEIVED', JSON.stringify(data), 'Processed', 'SUCCESS', null]
        );

        // Simple Keyword Logic
        const message = data?.payload?.body?.toUpperCase() || '';
        const sender = data?.payload?.from || ''; // e.g. 5215512345678@c.us
        const cleanPhone = sender.split('@')[0];

        if (message.includes('CONFIRM') || message.includes('CONFIRMAR')) {
             // Find latest scheduled appointment for this phone (Scoped to Tenant NOT enforced here yet as webhook is global, but typically webhook url is tenant specific or payload has id)
             // For now, simple lookup
             const aptRes = await pool.query(
                 "SELECT id FROM appointments WHERE client_phone LIKE $1 AND status = 'SCHEDULED' ORDER BY start_datetime DESC LIMIT 1",
                 [`%${cleanPhone}%`]
             );
             if (aptRes.rows.length > 0) {
                 await pool.query("UPDATE appointments SET status = 'CONFIRMED' WHERE id = $1", [aptRes.rows[0].id]);
                 console.log(`✅ Appointment ${aptRes.rows[0].id} confirmed via WhatsApp`);
                 sendWhatsAppMessage(cleanPhone, "¡Gracias! Tu cita ha sido confirmada.", null);
             }
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Webhook Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/appointments', async (req, res) => {
    try {
        // Multi-tenant filter
        let query = "SELECT * FROM appointments WHERE organization_id = $1";
        let params = [req.tenantId];

        if (req.branchId) {
            query += " AND branch_id = $2";
            params.push(req.branchId);
        }
        const result = await pool.query(query, params);
        const mapped = result.rows.map(a => ({
            id: a.id,
            title: a.title,
            startDateTime: a.start_datetime,
            endDateTime: a.end_datetime,
            clientName: a.client_name,
            clientPhone: a.client_phone,
            status: a.status,
            professionalId: a.professional_id,
            serviceId: a.service_id,
            notes: a.notes
        }));
        res.json(mapped);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const { title, startDateTime, endDateTime, clientName, clientPhone, professionalId, serviceId, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO appointments (title, start_datetime, end_datetime, client_name, client_phone, status, professional_id, service_id, notes, branch_id, organization_id)
             VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', $6, $7, $8, $9, $10)
             RETURNING id`,
            [title, startDateTime, endDateTime, clientName, clientPhone, professionalId, serviceId, notes, req.branchId, req.tenantId]
        );

        const newId = result.rows[0].id;

        // Notify via WhatsApp
        if (clientPhone) {
            const dateStr = new Date(startDateTime).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
            const message = `Hola ${clientName}, tu cita para "${title}" ha sido confirmada para el ${dateStr}. Te esperamos en Aurum.`;
            sendWhatsAppMessage(clientPhone, message, req.branchId);
        }

        // Notify Professional via Web Push
        try {
            // Find User associated with Professional
            const proUserRes = await pool.query(
                "SELECT * FROM users WHERE related_id = $1 AND role = 'PROFESSIONAL'",
                [professionalId]
            );

            if (proUserRes.rows.length > 0) {
                const proUser = proUserRes.rows[0];
                if (proUser.push_subscription) {
                    const payload = JSON.stringify({
                        title: 'Nueva Cita Agendada',
                        body: `Cliente: ${clientName} - ${new Date(startDateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
                        url: '/professional-dashboard'
                    });
                    await webPush.sendNotification(proUser.push_subscription, payload);
                    console.log(`🔔 Web Push Sent to Professional ${proUser.name}`);
                }
            }
        } catch (e) {
            console.error("Web Push Error:", e.message);
        }

        res.json({ success: true, id: newId });
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/marketing/campaigns/send', async (req, res) => {
    try {
        const { campaign } = req.body;
        // Fetch Target Audience
        let userQuery = "SELECT * FROM users WHERE role = 'CLIENT' AND organization_id = $1";
        let params = [req.tenantId];

        if (campaign.targetSegment === 'INACTIVE_90_DAYS') {
            userQuery += " AND created_at < NOW() - INTERVAL '90 days'";
        } else if (campaign.targetSegment === 'ACTIVE_LAST_30_DAYS') {
            userQuery += " AND created_at > NOW() - INTERVAL '30 days'";
        }

        const users = await pool.query(userQuery, params);
        let sentCount = 0;

        for (const user of users.rows) {
            if (campaign.channel === 'EMAIL' && user.email) {
                const success = await sendEmail(user.email, campaign.subject, campaign.content, req.branchId);
                if (success) sentCount++;
            } else if (campaign.channel === 'WHATSAPP' && user.phone) {
                // Use existing sendWhatsAppMessage
                await sendWhatsAppMessage(user.phone, campaign.content, req.branchId);
                sentCount++;
            }
        }

        res.json({ success: true, sentCount, message: `Campaña lanzada a ${sentCount} usuarios.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/integrations/status', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM integration_logs WHERE (branch_id = $1 OR $1 IS NULL) AND (organization_id = $2 OR organization_id IS NULL) ORDER BY created_at DESC LIMIT 20",
            [req.branchId || null, req.tenantId]
        );
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/saas/tenants/:id/impersonate', authenticateToken, checkGodMode, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE tenant_id = $1 AND role = 'STUDIO_OWNER' LIMIT 1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "No se encontró administrador en este nodo" });
    const targetUser = result.rows[0];
    const token = jwt.sign({ 
      id: targetUser.id, role: targetUser.role, tenantId: targetUser.tenant_id, isImpersonated: true, originalGodId: req.user.id
    }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token, user: targetUser });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;

    // --- DEVELOPMENT MODE BYPASS ---
    // If not in production, verify static dev credentials to avoid DB dependency for login
    if (process.env.NODE_ENV !== 'production' && phone === 'dev' && password === 'dev') {
        console.log("⚡ DEV MODE: Bypassing DB Login");
        return res.json({
            success: true,
            user: {
                id: 'dev-master-id',
                name: 'Dev Admin (Bypass)',
                phone: 'dev',
                role: 'ADMIN',
                branchId: 'dev-branch-01',
                email: 'dev@aurum.ai',
                preferences: { whatsapp: true, email: true }
            }
        });
    }
    // --------------------------------

    try {
        console.log(`[AUTH] Login Attempt: ${phone} | Tenant: ${req.tenantId}`);
        // Ensure user belongs to tenant (or is global/demo if needed, but strict mode enforces tenant)
        const result = await pool.query("SELECT * FROM users WHERE phone = $1 AND password = $2 AND organization_id = $3", [phone, password, req.tenantId]);

        if (result.rows.length > 0) {
            console.log(`[AUTH] Success for: ${phone}`);
            const user = result.rows[0];
            const mappedUser = {
                ...user,
                relatedId: user.related_id,
                role: user.role,
                branchId: user.branch_id // EXPLICITLY RETURN BRANCH ID
            };
            res.json({ success: true, user: mappedUser });
        } else {
            console.warn(`[AUTH] Failed for: ${phone}`);
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
    } catch (e) {
        console.error('[AUTH] DB Error:', e.message);
        res.status(500).json({error: e.message});
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const branchKey = req.branchId || 'global';
        const products = await getCached(`products:${branchKey}`, async () => {
            let query = "SELECT * FROM products";
            let params = [];
            if (req.branchId) {
                query += " WHERE branch_id = $1 OR branch_id IS NULL";
                params.push(req.branchId);
            }
            query += " ORDER BY name ASC";
            const result = await pool.query(query, params);
            return result.rows;
        });
        res.json(products);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await getCached('services', async () => {
             const result = await pool.query("SELECT * FROM services ORDER BY name ASC");
             return result.rows;
        });
        res.json(services);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/professionals', authenticateToken, tenantMiddleware, async (req, res) => {
  const result = await pool.query("SELECT id, name, role, email, aurum_employee_id as \"aurum_employee_id\", weekly_schedule as \"weeklySchedule\", exceptions FROM professionals WHERE tenant_id = $1", [req.tenant.id]);
  res.json(result.rows);
});

app.post('/api/payments/create_preference', async (req, res) => {
    try {
        const { items, payer, branchId } = req.body;

        if (!process.env.MP_ACCESS_TOKEN) {
            // Mock response if no token
            return res.json({
                mock: true,
                init_point: '#',
                id: 'mock_pref_123'
            });
        }

        const preference = new Preference(mpClient);
        const result = await preference.create({
            body: {
                items: items.map(item => ({
                    title: item.title,
                    quantity: item.quantity,
                    unit_price: parseFloat(item.price)
                })),
                payer: {
                    email: payer.email,
                    name: payer.name
                },
                back_urls: {
                    success: `${req.headers.origin}/pos?status=success`,
                    failure: `${req.headers.origin}/pos?status=failure`,
                    pending: `${req.headers.origin}/pos?status=pending`
                },
                auto_return: 'approved',
                metadata: {
                    branch_id: branchId
                }
            }
        });

        res.json({
            id: result.id,
            init_point: result.init_point
        });
    } catch (e) {
        console.error('MP Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/payments/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        if (type === 'payment') {
            // Here you would check payment status with MP API using data.id
            // For now we just log it
            await pool.query(
                "INSERT INTO integration_logs (platform, event_type, payload, status) VALUES ($1, $2, $3, $4)",
                ['MERCADOPAGO', 'WEBHOOK_PAYMENT', JSON.stringify(req.body), 'RECEIVED']
            );
        }
        res.sendStatus(200);
    } catch (e) {
        console.error('MP Webhook Error:', e);
        res.sendStatus(500);
    }
});

app.get('/api/settings/landing', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM landing_settings WHERE id = 1");
        let data = result.rows.length > 0 ? result.rows[0] : { };
        
        const normalized = {
            businessName: data.business_name || 'CitaPlanner Elite',
            primaryColor: data.primary_color || '#630E14',
            secondaryColor: data.secondary_color || '#C5A028',
            templateId: data.template_id || 'citaplanner',
            slogan: data.slogan || 'Gestión de Lujo Simplificada',
            aboutText: data.about_text || 'Plataforma líder.',
            address: data.address || 'Ubicación Central',
            contactPhone: data.contact_phone || '+52 55 0000 0000',
            heroImageUrl: data.hero_image_url || ''
        };
        res.json(normalized);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/notifications/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', async (req, res) => {
    const { subscription, userId } = req.body;
    try {
        await pool.query(
            "UPDATE users SET push_subscription = $1 WHERE id = $2",
            [subscription, userId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'dist'), { maxAge: '1d' })); // Cachear archivos estáticos
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

// INITIALIZE INFRASTRUCTURE
connectRedis();
initDB();
