
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import nodemailer from 'nodemailer';
import webPush from 'web-push';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000';

// --- DATABASE & REDIS SETUP ---

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
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(50) DEFAULT 'demo',
        name VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        manager VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure Default Branch
    const branchRes = await client.query("SELECT id FROM branches LIMIT 1");
    let defaultBranchId;
    
    if (branchRes.rowCount === 0) {
      const newBranch = await client.query(`
        INSERT INTO branches (name, address, status) 
        VALUES ('Sede Central Aurum', 'Av. Principal 123', 'ACTIVE') 
        RETURNING id;
      `);
      defaultBranchId = newBranch.rows[0].id;
    } else {
      defaultBranchId = branchRes.rows[0].id;
    }

    // Core Tables
    await client.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure column exists for existing DBs
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB'); } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        role VARCHAR(50),
        email VARCHAR(100),
        weekly_schedule JSONB,
        exceptions JSONB,
        service_ids TEXT,
        birth_date DATE,
        branch_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        duration INT,
        price DECIMAL(10,2),
        category VARCHAR(50),
        description TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        branch_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        sku VARCHAR(50),
        category VARCHAR(50),
        price DECIMAL(10,2),
        cost DECIMAL(10,2),
        stock INT,
        min_stock INT,
        usage VARCHAR(20),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        branch_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(150),
        start_datetime TIMESTAMP,
        end_datetime TIMESTAMP,
        client_name VARCHAR(100),
        client_phone VARCHAR(20),
        status VARCHAR(20),
        professional_id VARCHAR(100),
        service_id VARCHAR(100),
        notes TEXT,
        branch_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        client_name VARCHAR(100),
        total DECIMAL(10,2),
        payment_method VARCHAR(20),
        items JSONB,
        status VARCHAR(20) DEFAULT 'PAID',
        branch_id UUID
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_logs (
          id SERIAL PRIMARY KEY,
          platform VARCHAR(50),
          event_type VARCHAR(50),
          payload JSONB,
          response TEXT,
          status VARCHAR(20),
          branch_id UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
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

    await runMigration(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) DEFAULT 'demo'`);
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
            INSERT INTO users (name, phone, email, password, role, branch_id, preferences)
            VALUES ('Admin Master', 'admin', 'admin@aurum.ai', '123', 'ADMIN', $1, '{"whatsapp":true,"email":true}')
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
            INSERT INTO professionals (name, role, email, branch_id, weekly_schedule, exceptions, service_ids)
            VALUES ('Dra. Ana Elite', 'Dermatología', 'ana@aurum.ai', $1, $2, '[]', '[]')
            RETURNING id
        `, [defaultBranchId, defaultSchedule]);
        await client.query(`
            INSERT INTO users (name, phone, email, password, role, related_id, branch_id)
            VALUES ('Dra. Ana Elite', 'pro', 'ana@aurum.ai', 'pro123', 'PROFESSIONAL', $1, $2)
        `, [proRes.rows[0].id, defaultBranchId]);

        // CLIENT
        await client.query(`
            INSERT INTO users (name, phone, email, password, role, branch_id, skin_type, loyalty_points)
            VALUES ('Valeria Gold', 'client', 'valeria@client.com', 'client123', 'CLIENT', $1, 'Fitzpatrick III', 150)
        `, [defaultBranchId]);
    }

    await client.query('COMMIT');
    console.log("✅ Aurum Protocol: Database Schema Synchronized");
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ DB Init Error:', e);
  } finally {
    if (client) client.release();
  }
};

const branchMiddleware = (req, res, next) => {
    const branchId = req.headers['x-branch-id'];
    const tenantId = req.headers['x-tenant-id'] || 'demo';
    req.branchId = branchId;
    req.tenantId = tenantId;
    next();
};

app.use(branchMiddleware);

// --- ROUTES ---

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
             // Find latest scheduled appointment for this phone
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
        let query = "SELECT * FROM appointments";
        let params = [];
        if (req.branchId) {
            query += " WHERE branch_id = $1";
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
            `INSERT INTO appointments (title, start_datetime, end_datetime, client_name, client_phone, status, professional_id, service_id, notes, branch_id)
             VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', $6, $7, $8, $9)
             RETURNING id`,
            [title, startDateTime, endDateTime, clientName, clientPhone, professionalId, serviceId, notes, req.branchId]
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
        let userQuery = "SELECT * FROM users WHERE role = 'CLIENT'";
        if (campaign.targetSegment === 'INACTIVE_90_DAYS') {
            userQuery += " AND created_at < NOW() - INTERVAL '90 days'";
        } else if (campaign.targetSegment === 'ACTIVE_LAST_30_DAYS') {
            userQuery += " AND created_at > NOW() - INTERVAL '30 days'";
        }

        const users = await pool.query(userQuery);
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
            "SELECT * FROM integration_logs WHERE branch_id = $1 OR $1 IS NULL ORDER BY created_at DESC LIMIT 20", 
            [req.branchId || null]
        );
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// Stats Endpoint
app.get('/api/stats/business', async (req, res) => {
    try {
        const revRes = await pool.query("SELECT SUM(total) as revenue FROM transactions WHERE branch_id = $1 OR $1 IS NULL", [req.branchId || null]);
        const apptRes = await pool.query("SELECT COUNT(*) as count FROM appointments WHERE status='COMPLETED' AND (branch_id = $1 OR $1 IS NULL)", [req.branchId || null]);
        const clientRes = await pool.query("SELECT COUNT(*) as count FROM users WHERE role='CLIENT' AND created_at > NOW() - INTERVAL '30 days'");
        
        res.json({
            revenueThisMonth: parseFloat(revRes.rows[0].revenue || 0),
            appointmentsCompleted: parseInt(apptRes.rows[0].count || 0),
            newClientsThisMonth: parseInt(clientRes.rows[0].count || 0),
            occupationRate: 78
        });
    } catch (e) { res.status(500).json({error: e.message}); }
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
        console.log(`[AUTH] Login Attempt: ${phone}`);
        const result = await pool.query("SELECT * FROM users WHERE phone = $1 AND password = $2", [phone, password]);
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

app.get('/api/professionals', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM professionals");
        const mapped = result.rows.map(p => ({
            ...p,
            weeklySchedule: p.weekly_schedule,
            exceptions: p.exceptions || [],
            serviceIds: p.service_ids
        }));
        res.json(mapped);
    } catch (e) { res.status(500).json({error: e.message}); }
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

// START SERVER IMMEDIATELY
app.listen(PORT, () => console.log(`🚀 AURUM NODE ACTIVE | Port: ${PORT}`));

// INITIALIZE INFRASTRUCTURE
connectRedis();
initDB();
