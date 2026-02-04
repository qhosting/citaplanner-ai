
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
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import prismaClientPkg from '@prisma/client';
const { PrismaClient } = prismaClientPkg;
import jwt from 'jsonwebtoken';
import { validateRequest } from './middleware/validation.js';
import { loginSchema, appointmentSchema, professionalSchema, saasRegisterSchema } from './schemas/index.js';

const prisma = new PrismaClient();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Trust proxy is required when running behind a reverse proxy (Caddy/Nginx)
// to correctly identify client IP addresses for rate limiting.
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'citaplanner.com').toLowerCase();
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'aum-core-secure-2026-fix';
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';

// --- OPTIMIZACIÓN: CACHÉ DE TENANTS ---
const tenantCache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

// --- REDIS CONFIG ---
let redisClient = null;

const initRedis = async () => {
    const redisUrl = REDIS_URL || (process.env.NODE_ENV === 'development' ? 'redis://localhost:6379' : null);

    if (!redisUrl) {
        console.warn("⚠️ Redis URL not configured. Caching disabled.");
        return;
    }

    try {
        redisClient = createClient({ url: redisUrl });

        redisClient.on('error', (err) => {
            console.error('⚠️ Redis Client Error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('🔄 Redis connecting...');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis Connected and Ready');
        });

        await redisClient.connect();
    } catch (e) {
        console.error("❌ Redis Connection Failed:", e.message);
        console.warn("⚠️ Continuing without Redis. Caching disabled.");
        redisClient = null;
    }
};

// Initialize Redis on startup
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

// @DEPRECATED: Pool is only used for initDB() legacy migrations
// TODO: Migrate to Prisma Migrate (npx prisma migrate dev)
const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('sslmode=disable') || !process.env.DATABASE_URL ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client', err);
});

// Redis Client initialized by initRedis() above

const getCached = async (key, fetchFn, ttl = 300) => {
    // Check if Redis is available and connected
    if (!redisClient || !redisClient.isOpen) {
        return fetchFn();
    }

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log(`📦 Cache HIT: ${key}`);
            return JSON.parse(cached);
        }

        console.log(`📭 Cache MISS: ${key}`);
        const data = await fetchFn();

        if (data) {
            await redisClient.setEx(key, ttl, JSON.stringify(data));
        }

        return data;
    } catch (e) {
        console.warn(`⚠️ Cache Error for ${key}:`, e.message);
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

        await prisma.integrationLog.create({
            data: {
                platform: 'WHATSAPP',
                eventType: 'SEND_MESSAGE',
                payload: { chatId, text },
                response: 'Sent',
                status: 'SUCCESS',
                branchId
            }
        });
    } catch (e) {
        console.error('❌ WhatsApp Send Error:', e.message);
        await prisma.integrationLog.create({
            data: {
                platform: 'WHATSAPP',
                eventType: 'SEND_ERROR',
                payload: { phone, text },
                response: e.message,
                status: 'ERROR',
                branchId
            }
        });
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
        await prisma.integrationLog.create({
            data: {
                platform: 'EMAIL',
                eventType: 'SEND_MESSAGE',
                payload: { to, subject },
                response: 'Sent',
                status: 'SUCCESS',
                branchId
            }
        });
        return true;
    } catch (e) {
        console.error('❌ Email Send Error:', e.message);
        await prisma.integrationLog.create({
            data: {
                platform: 'EMAIL',
                eventType: 'SEND_ERROR',
                payload: { to, subject },
                response: e.message,
                status: 'ERROR',
                branchId
            }
        });
        return false;
    }
};


// ------------------------------------
// MIDDLEWARES & RATE LIMITING
// ------------------------------------

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use(helmet({
    contentSecurityPolicy: false // Disabled for dev flexibility, tighten in prod
}));
app.use(cors());


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// @DEPRECATED: This function uses raw SQL for schema creation and seeding
// TODO: Replace with Prisma Migrate migrations and seed scripts
// Run: npx prisma migrate dev --name init
// Then: npx prisma db seed
const initDB = async () => {
    const client = await pool.connect();
    try {
        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

        // --- MIGRACIÓN: ASEGURAR COLUMNAS ---
        // Si las tablas ya existen de una versión previa, CREATE TABLE IF NOT EXISTS no las actualiza.
        await client.query(`
            DO $$ 
            BEGIN 
                -- Tenants
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='tenants' AND column_name='organization_id') THEN
                        ALTER TABLE tenants ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                END IF;

                -- Branches
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'branches') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='branches' AND column_name='organization_id') THEN
                        ALTER TABLE branches ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                END IF;

                -- Users
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='organization_id') THEN
                        ALTER TABLE users ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='related_id') THEN
                        ALTER TABLE users ADD COLUMN related_id VARCHAR(100);
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='branch_id') THEN
                        ALTER TABLE users ADD COLUMN branch_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='tenant_id') THEN
                        ALTER TABLE users ADD COLUMN tenant_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='preferences') THEN
                        ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='push_subscription') THEN
                        ALTER TABLE users ADD COLUMN push_subscription JSONB;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='skin_type') THEN
                        ALTER TABLE users ADD COLUMN skin_type VARCHAR(100);
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='allergies') THEN
                        ALTER TABLE users ADD COLUMN allergies TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='medical_conditions') THEN
                        ALTER TABLE users ADD COLUMN medical_conditions TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='loyalty_points') THEN
                        ALTER TABLE users ADD COLUMN loyalty_points INTEGER DEFAULT 0;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='avatar') THEN
                        ALTER TABLE users ADD COLUMN avatar TEXT;
                    END IF;
                END IF;

                -- Professionals
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'professionals') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='organization_id') THEN
                        ALTER TABLE professionals ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='branch_id') THEN
                        ALTER TABLE professionals ADD COLUMN branch_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='tenant_id') THEN
                        ALTER TABLE professionals ADD COLUMN tenant_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='aurum_employee_id') THEN
                        ALTER TABLE professionals ADD COLUMN aurum_employee_id VARCHAR(50);
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='service_ids') THEN
                        ALTER TABLE professionals ADD COLUMN service_ids TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='weekly_schedule') THEN
                        ALTER TABLE professionals ADD COLUMN weekly_schedule JSONB DEFAULT '[]';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='exceptions') THEN
                        ALTER TABLE professionals ADD COLUMN exceptions JSONB DEFAULT '[]';
                    END IF;
                END IF;

                -- Services
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='services' AND column_name='organization_id') THEN
                        ALTER TABLE services ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='services' AND column_name='branch_id') THEN
                        ALTER TABLE services ADD COLUMN branch_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='services' AND column_name='tenant_id') THEN
                        ALTER TABLE services ADD COLUMN tenant_id UUID;
                    END IF;
                END IF;

                -- Appointments
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='appointments' AND column_name='organization_id') THEN
                        ALTER TABLE appointments ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='appointments' AND column_name='notes') THEN
                        ALTER TABLE appointments ADD COLUMN notes TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='appointments' AND column_name='branch_id') THEN
                        ALTER TABLE appointments ADD COLUMN branch_id UUID;
                    END IF;
                END IF;

                -- Integration Logs
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'integration_logs') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='integration_logs' AND column_name='organization_id') THEN
                        ALTER TABLE integration_logs ADD COLUMN organization_id VARCHAR(50) DEFAULT 'demo';
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='integration_logs' AND column_name='branch_id') THEN
                        ALTER TABLE integration_logs ADD COLUMN branch_id UUID;
                    END IF;
                END IF;
            END $$;
        `);

        // 0. Preliminary Tables (Independent of others)
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
                hero_image_url TEXT,
                organization_id VARCHAR(50) DEFAULT 'demo',
                features JSONB DEFAULT '{"ai": true, "inventory": true, "marketing": true}'
            );
        `);

        // 1. Fundamental Tables
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

            CREATE TABLE IF NOT EXISTS branches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                tenant_id UUID REFERENCES tenants(id),
                organization_id VARCHAR(50) DEFAULT 'demo',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100),
                password VARCHAR(100),
                role VARCHAR(20),
                related_id VARCHAR(100),
                branch_id UUID REFERENCES branches(id),
                tenant_id UUID REFERENCES tenants(id),
                organization_id VARCHAR(50) DEFAULT 'demo',
                preferences JSONB DEFAULT '{}',
                push_subscription JSONB,
                skin_type VARCHAR(100),
                allergies TEXT,
                medical_conditions TEXT,
                avatar TEXT,
                loyalty_points INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS professionals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                email VARCHAR(255),
                aurum_employee_id VARCHAR(50),
                weekly_schedule JSONB DEFAULT '[]',
                exceptions JSONB DEFAULT '[]',
                service_ids TEXT,
                tenant_id UUID REFERENCES tenants(id),
                branch_id UUID REFERENCES branches(id),
                organization_id VARCHAR(50) DEFAULT 'demo',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS services (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                duration INTEGER NOT NULL,
                price DECIMAL(12, 2) NOT NULL,
                category VARCHAR(100),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                description TEXT,
                image_url TEXT,
                tenant_id UUID REFERENCES tenants(id),
                branch_id UUID REFERENCES branches(id),
                organization_id VARCHAR(50) DEFAULT 'demo'
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
                notes TEXT,
                professional_id UUID REFERENCES professionals(id),
                service_id UUID REFERENCES services(id),
                tenant_id UUID REFERENCES tenants(id),
                branch_id UUID REFERENCES branches(id),
                organization_id VARCHAR(50) DEFAULT 'demo'
            );

            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(100) NOT NULL,
                value JSONB NOT NULL,
                tenant_id UUID REFERENCES tenants(id),
                PRIMARY KEY(key, tenant_id)
            );

            CREATE TABLE IF NOT EXISTS integration_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                platform VARCHAR(50),
                event_type VARCHAR(100),
                payload JSONB,
                response TEXT,
                status VARCHAR(20),
                branch_id UUID REFERENCES branches(id),
                organization_id VARCHAR(50) DEFAULT 'demo',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                price DECIMAL(12, 2),
                stock INTEGER DEFAULT 0,
                branch_id UUID REFERENCES branches(id),
                organization_id VARCHAR(50) DEFAULT 'demo',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                amount DECIMAL(12, 2),
                mp_payment_id VARCHAR(100),
                mp_status VARCHAR(50),
                branch_id UUID REFERENCES branches(id),
                organization_id VARCHAR(50) DEFAULT 'demo',
                created_at TIMESTAMP DEFAULT NOW()
            );


            CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_org ON users(phone, organization_id);
        `);

        // 2. Seeding Master Tenant
        const masterIdRes = await client.query(`
            INSERT INTO tenants(name, subdomain, status, plan_type)
            VALUES('Aurum Global Nexus', 'master', 'ACTIVE', 'LEGACY') 
            ON CONFLICT(subdomain) DO UPDATE SET name = EXCLUDED.name 
            RETURNING id
        `);
        const masterId = masterIdRes.rows[0].id;

        // 3. Seeding Default Branch
        const branchRes = await client.query(`
            INSERT INTO branches(name, organization_id, tenant_id)
            VALUES('Sucursal Central', 'demo', $1) 
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [masterId]);

        let defaultBranchId = branchRes.rows[0]?.id;
        if (!defaultBranchId) {
            const b = await client.query("SELECT id FROM branches WHERE organization_id = 'demo' LIMIT 1");
            defaultBranchId = b.rows[0].id;
        }

        // 4. Default Landing Settings
        const settingsCheck = await client.query("SELECT id FROM landing_settings WHERE id = 1");
        if (settingsCheck.rowCount === 0) {
            await client.query(`
                INSERT INTO landing_settings(id, business_name, primary_color, secondary_color, template_id, slogan, about_text, address, contact_phone)
                VALUES(1, 'CitaPlanner Elite', '#630E14', '#C5A028', 'citaplanner', 'Gestión de Lujo Simplificada', 'Plataforma líder en gestión de citas.', 'Av. Principal 123, CDMX', '+52 55 1234 5678')
            `);
        }

        // 5. Seeding Services
        const serviceCount = await client.query("SELECT count(*) FROM services");
        if (parseInt(serviceCount.rows[0].count) === 0) {
            const servicesToSeed = [
                ['PESTAÑAS', 'TECNICA CLASICA', 550, 'NATURAL', 90],
                ['UÑAS', 'GEL SEMIPERMANENTE', 120, '1 TONO', 45]
            ];
            for (const s of servicesToSeed) {
                await client.query(
                    "INSERT INTO services (category, name, price, description, duration, branch_id, tenant_id, organization_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')",
                    [s[0], s[1], s[2], s[3], s[4], defaultBranchId, masterId, 'demo']
                );
            }
        }

        // 6. Seeding Users
        const userCount = await client.query("SELECT count(*) FROM users");
        if (parseInt(userCount.rows[0].count) === 0) {
            // ADMIN
            await client.query(`
                INSERT INTO users(name, phone, email, password, role, branch_id, tenant_id, organization_id, preferences)
                VALUES($1, $2, $3, $4, 'ADMIN', $5, $6, 'demo', '{"whatsapp":true,"email":true}')
            `, [
                process.env.SEED_ADMIN_NAME || 'Admin Master',
                process.env.SEED_ADMIN_PHONE || 'admin',
                process.env.SEED_ADMIN_EMAIL || 'admin@aurum.ai',
                bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || '123', 10),
                defaultBranchId,
                masterId
            ]);
            // PRO
            const defaultSchedule = JSON.stringify([
                { dayOfWeek: 1, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 2, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 3, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 4, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 5, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] }
            ]);
            const proRes = await client.query(`
                INSERT INTO professionals(name, role, email, branch_id, tenant_id, weekly_schedule, exceptions, service_ids, organization_id)
                VALUES('Dra. Ana Elite', 'Dermatología', 'ana@aurum.ai', $1, $2, $3, '[]', '[]', 'demo')
                RETURNING id
            `, [defaultBranchId, masterId, defaultSchedule]);

            await client.query(`
                INSERT INTO users(name, phone, email, password, role, related_id, branch_id, tenant_id, organization_id)
                VALUES('Dra. Ana Elite', 'pro', 'ana@aurum.ai', $1, 'PROFESSIONAL', $2, $3, $4, 'demo')
            `, [bcrypt.hashSync('pro123', 10), proRes.rows[0].id, defaultBranchId, masterId]);
        }

        // QHOSTING ADMIN (UPSERT LOGIC)
        if (process.env.QHOSTING_ADMIN_PHONE) {
            const existingAdmin = await client.query("SELECT id FROM users WHERE phone = $1 AND organization_id = 'demo'", [process.env.QHOSTING_ADMIN_PHONE]);

            if (existingAdmin.rows.length === 0) {
                await client.query(`
                    INSERT INTO users(name, phone, email, password, role, branch_id, tenant_id, organization_id, preferences)
                    VALUES($1, $2, $3, $4, 'ADMIN', $5, $6, 'demo', '{"whatsapp":true,"email":true}')
                `, [
                    process.env.QHOSTING_ADMIN_NAME || 'CEO AURUM',
                    process.env.QHOSTING_ADMIN_PHONE,
                    process.env.QHOSTING_ADMIN_EMAIL || 'admin@qhosting.net',
                    bcrypt.hashSync(process.env.QHOSTING_ADMIN_PASSWORD || 'x0420EZS*', 10),
                    defaultBranchId,
                    masterId
                ]);
            } else {
                await client.query(`
                    UPDATE users SET 
                        name = COALESCE($1, name),
                        email = COALESCE($2, email),
                        password = CASE WHEN $3::text IS NOT NULL THEN $4 ELSE password END
                    WHERE phone = $5 AND organization_id = 'demo'
                `, [
                    process.env.QHOSTING_ADMIN_NAME || 'CEO AURUM',
                    process.env.QHOSTING_ADMIN_EMAIL || 'admin@qhosting.net',
                    process.env.QHOSTING_ADMIN_PASSWORD || null,
                    process.env.QHOSTING_ADMIN_PASSWORD ? bcrypt.hashSync(process.env.QHOSTING_ADMIN_PASSWORD, 10) : null,
                    process.env.QHOSTING_ADMIN_PHONE
                ]);
            }
        }



        console.log("✅ Infraestructura Aurum Nexus v5.1 Operativa.");
    } catch (e) {
        console.error("❌ Error en initDB:", e.message);
    } finally {
        client.release();
    }
};

const tenantMiddleware = (req, res, next) => {
    try {
        // 1. Detect Tenant from Subdomain
        const host = req.headers.host || '';
        const parts = host.split('.');
        let tenantId = 'demo';

        if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'citaplanner') {
            tenantId = parts[0];
        } else {
            tenantId = req.headers['x-tenant-id'] || 'demo';
        }

        req.tenantId = tenantId;
        req.branchId = req.headers['x-branch-id'];

        console.log(`[CTX] Tenant: ${tenantId} | Branch: ${req.branchId || 'ALL'} `);
        next();
    } catch (e) {
        res.status(500).json({ error: "Falla de red" });
    }
};

app.use(tenantMiddleware);

const checkGodMode = (req, res, next) => {
    if (req.user?.role !== 'GOD_MODE') return res.status(403).json({ error: "Privilegios insuficientes" });
    next();
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "No autorizado" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// AURUM HUB INTEGRATION (PROXY)
app.post('/api/integrations/aurum/sync', async (req, res) => {
    // Stub for syncing business identity with Master Hub
    console.log(`[AURUM HUB] Syncing identity for tenant: ${req.tenantId} `);
    res.json({ success: true, status: 'SYNCED', hubId: `hub_${req.tenantId} ` });
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
        const branches = await prisma.branch.findMany({
            where: { organizationId: req.tenantId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(branches);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/integrations/whatsapp/webhook', async (req, res) => {
    try {
        const data = req.body;
        // Basic logging
        console.log("🔔 WhatsApp Webhook:", JSON.stringify(data));
        await prisma.integrationLog.create({
            data: {
                platform: 'WHATSAPP',
                eventType: 'WEBHOOK_RECEIVED',
                payload: data,
                response: 'Processed',
                status: 'SUCCESS',
                branchId: null
            }
        });

        // Simple Keyword Logic
        const message = data?.payload?.body?.toUpperCase() || '';
        const sender = data?.payload?.from || ''; // e.g. 5215512345678@c.us
        const cleanPhone = sender.split('@')[0];

        if (message.includes('CONFIRM') || message.includes('CONFIRMAR')) {
            // Find latest scheduled appointment for this phone
            const appointment = await prisma.appointment.findFirst({
                where: {
                    clientPhone: {
                        contains: cleanPhone
                    },
                    status: 'SCHEDULED'
                },
                orderBy: {
                    startDateTime: 'desc'
                }
            });

            if (appointment) {
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { status: 'CONFIRMED' }
                });
                console.log(`✅ Appointment ${appointment.id} confirmed via WhatsApp`);
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
        const where = {
            organizationId: req.tenantId
        };
        if (req.branchId) {
            where.branchId = req.branchId;
        }

        const appointments = await prisma.appointment.findMany({
            where,
            orderBy: { startDateTime: 'desc' }
        });

        // Prisma returns camelCase fields matching the schema, which matches the API response format
        res.json(appointments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/appointments', validateRequest(appointmentSchema), async (req, res) => {
    try {
        const { title, startDateTime, endDateTime, clientName, clientPhone, professionalId, serviceId, notes } = req.body;

        const newAppointment = await prisma.appointment.create({
            data: {
                title,
                startDateTime: new Date(startDateTime),
                endDateTime: new Date(endDateTime),
                clientName,
                clientPhone,
                status: 'SCHEDULED',
                professionalId,
                serviceId,
                notes,
                branchId: req.branchId,
                organizationId: req.tenantId
            }
        });

        const newId = newAppointment.id;

        // Notify via WhatsApp
        if (clientPhone) {
            const dateStr = new Date(startDateTime).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
            const message = `Hola ${clientName}, tu cita para "${title}" ha sido confirmada para el ${dateStr}. Te esperamos en Aurum.`;
            sendWhatsAppMessage(clientPhone, message, req.branchId);
        }

        // Notify Professional via Web Push
        try {
            // Find User associated with Professional
            const proUser = await prisma.user.findFirst({
                where: { relatedId: professionalId, role: 'PROFESSIONAL' }
            });

            if (proUser) {
                if (proUser.push_subscription) {
                    const payload = JSON.stringify({
                        title: 'Nueva Cita Agendada',
                        body: `Cliente: ${clientName} - ${new Date(startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `,
                        url: '/professional-dashboard'
                    });
                    await webPush.sendNotification(proUser.push_subscription, payload);
                    console.log(`🔔 Web Push Sent to Professional ${proUser.name} `);
                }
            }
        } catch (e) {
            console.error("Web Push Error:", e.message);
        }

        res.json({ success: true, id: newId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/marketing/campaigns/send', async (req, res) => {
    try {
        const { campaign } = req.body;

        // Build Prisma where clause for target audience
        const where = {
            role: 'CLIENT',
            organizationId: req.tenantId
        };

        // Add time-based filters
        if (campaign.targetSegment === 'INACTIVE_90_DAYS') {
            where.createdAt = {
                lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            };
        } else if (campaign.targetSegment === 'ACTIVE_LAST_30_DAYS') {
            where.createdAt = {
                gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            };
        }

        const users = await prisma.user.findMany({ where });
        let sentCount = 0;

        for (const user of users) {
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
        const where = {};

        if (req.branchId) {
            where.branchId = req.branchId;
        }

        if (req.tenantId) {
            where.OR = [
                { organizationId: req.tenantId },
                { organizationId: null }
            ];
        }

        const logs = await prisma.integrationLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/saas/tenants/:id/impersonate', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const targetUser = await prisma.user.findFirst({
            where: {
                // Note: Using organizationId as tenantId proxy based on schema
                organizationId: req.params.id,
                role: 'STUDIO_OWNER'
            }
        });

        if (!targetUser) {
            return res.status(404).json({ error: "No se encontró administrador en este nodo" });
        }

        const token = jwt.sign({
            id: targetUser.id,
            role: targetUser.role,
            tenantId: targetUser.organizationId,
            isImpersonated: true,
            originalGodId: req.user?.id
        }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, token, user: targetUser });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', loginLimiter, validateRequest(loginSchema), async (req, res) => {
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
        console.log(`[AUTH DEBUG] Login Attempt: ${phone} | Tenant: ${req.tenantId} `);
        const user = await prisma.user.findFirst({ where: { phone, organizationId: req.tenantId } });

        console.log(`[AUTH DEBUG] User Found: ${user ? 'YES' : 'NO'} (ID: ${user?.id})`);

        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);
            console.log(`[AUTH DEBUG] Password Valid: ${validPassword ? 'YES' : 'NO'} `);

            if (!validPassword) return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

            console.log(`[AUTH] Success for: ${phone} `);

            // Generate Token
            const token = jwt.sign({
                id: user.id,
                role: user.role,
                tenantId: req.tenantId,
                branchId: user.branchId
            }, JWT_SECRET, { expiresIn: '8h' });

            const mappedUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                branchId: user.branchId,
                relatedId: user.relatedId
            };

            res.json({ success: true, token, user: mappedUser });
        } else {
            console.warn(`[AUTH] Failed for: ${phone} `);
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
    } catch (e) {
        console.error('[AUTH] DB Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const branchKey = req.branchId || 'global';
        const products = await getCached(`products:${branchKey} `, async () => {
            const where = req.branchId ? { branchId: req.branchId } : {};
            return await prisma.product.findMany({
                where,
                orderBy: { name: 'asc' }
            });
        });
        res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await getCached('services', async () => {
            return await prisma.service.findMany({
                orderBy: { name: 'asc' }
            });
        });
        res.json(services);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/professionals', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const professionals = await prisma.professional.findMany({
            where: { organizationId: req.tenantId },
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                aurumEmployeeId: true,
                weeklySchedule: true,
                exceptions: true
            }
        });
        res.json(professionals);
    } catch (e) { res.status(500).json({ error: e.message }); }
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
            await prisma.integrationLog.create({
                data: {
                    platform: 'MERCADOPAGO',
                    eventType: 'WEBHOOK_PAYMENT',
                    payload: JSON.stringify(req.body),
                    status: 'RECEIVED'
                }
            });
        }
        res.sendStatus(200);
    } catch (e) {
        console.error('MP Webhook Error:', e);
        res.sendStatus(500);
    }
});

app.get('/api/settings/landing', async (req, res) => {
    try {
        const data = await prisma.landingSetting.findUnique({
            where: { id: 1 }
        }) || {};

        const normalized = {
            businessName: data.businessName || 'CitaPlanner Elite',
            primaryColor: data.primaryColor || '#630E14',
            secondaryColor: data.secondaryColor || '#C5A028',
            templateId: data.templateId || 'citaplanner',
            slogan: data.slogan || 'Gestión de Lujo Simplificada',
            aboutText: data.aboutText || 'Plataforma líder.',
            address: data.address || 'Ubicación Central',
            contactPhone: data.contactPhone || '+52 55 0000 0000',
            heroImageUrl: data.heroImageUrl || ''
        };
        res.json(normalized);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notifications/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', async (req, res) => {
    const { subscription, userId } = req.body;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { pushSubscription: subscription }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// INITIALIZE INFRASTRUCTURE

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    initDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://${ROOT_DOMAIN}:${PORT}`);
        });
    });
}

export { app };
