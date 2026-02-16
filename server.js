
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import { createServer } from 'http';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';
import webPush from 'web-push';
import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import prismaClientPkg from '@prisma/client';
const { PrismaClient } = prismaClientPkg;
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import ics from 'ics';
import Openpay from 'openpay';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.ROOT_DOMAIN}/api/auth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);
import { validateRequest } from './middleware/validation.js';
import { loginSchema, appointmentSchema, professionalSchema, saasRegisterSchema } from './schemas/index.js';

const prisma = new PrismaClient();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Socket Rooms and Real-time logic
io.on('connection', (socket) => {
    socket.on('join-tenant', (tenantId) => {
        if (tenantId) {
            socket.join(tenantId);
            console.log(`📡 Socket: Client joined room [${tenantId}]`);
        }
    });

    socket.on('disconnect', () => {
        // Optional: cleanup
    });
});

const emitTenantEvent = (tenantId, event, data) => {
    if (tenantId) {
        io.to(tenantId).emit(event, data);
        console.log(`📤 Socket Emit: [${event}] -> Room [${tenantId}]`);
    }
};

// Trust proxy is required when running behind a reverse proxy (Caddy/Nginx)
// to correctly identify client IP addresses for rate limiting.
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'citaplanner.com').toLowerCase();
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'aum-core-secure-2026-fix';
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';

const SAAS_PLANS = [
    {
        id: 'BASIC',
        title: 'Básico (Starter)',
        price: 299,
        currency: 'MXN',
        description: 'Ideal para independientes',
        features: { ai_scheduler: true, marketing_pro: false, inventory_advanced: false, analytics_nexus: false }
    },
    {
        id: 'PRO',
        title: 'Pro (Growth)',
        price: 599,
        currency: 'MXN',
        description: 'Para pequeños equipos',
        features: { ai_scheduler: true, marketing_pro: true, inventory_advanced: true, analytics_nexus: false }
    },
    {
        id: 'ELITE',
        title: 'Elite (Enterprise)',
        price: 999,
        currency: 'MXN',
        description: 'Poder total sin límites',
        features: { ai_scheduler: true, marketing_pro: true, inventory_advanced: true, analytics_nexus: true }
    }
];


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

// Openpay Client (Modo Dios Integration)
const openpay = new Openpay(
    process.env.OPENPAY_MERCHANT_ID || 'mzdtln0b7vev2m2m6m6g',
    process.env.OPENPAY_PRIVATE_KEY || 'sk_e5d2277f91524dd69bc43c299f18a6d6',
    process.env.OPENPAY_PRODUCTION_MODE === 'true'
);

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
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='refresh_token') THEN
                        ALTER TABLE users ADD COLUMN refresh_token TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
                        ALTER TABLE users ADD COLUMN reset_token TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expiry') THEN
                        ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
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
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='google_access_token') THEN
                        ALTER TABLE professionals ADD COLUMN google_access_token TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='google_refresh_token') THEN
                        ALTER TABLE professionals ADD COLUMN google_refresh_token TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='google_calendar_id') THEN
                        ALTER TABLE professionals ADD COLUMN google_calendar_id TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='calendar_sync_enabled') THEN
                        ALTER TABLE professionals ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT FALSE;
                    END IF;
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='professionals' AND column_name='ical_token') THEN
                        ALTER TABLE professionals ADD COLUMN ical_token TEXT;
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

                -- Custom Domain Migration
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants') THEN
                    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='tenants' AND column_name='custom_domain') THEN
                        ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(255);
                    END IF;
                END IF;

                -- Landing Settings Multi-Tenancy
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'landing_settings') THEN
                    -- Change id from INT to UUID if needed, but keeping simple: Ensure organization_id is unique
                    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'landing_settings' AND indexname = 'idx_landing_org_unique') THEN
                        CREATE UNIQUE INDEX idx_landing_org_unique ON landing_settings(organization_id);
                    END IF;
                END IF;

            END $$;
        `);

        // 0. Preliminary Tables (Independent of others)
        await client.query(`
            CREATE TABLE IF NOT EXISTS landing_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_name VARCHAR(100) DEFAULT 'CitaPlanner Elite',
                primary_color VARCHAR(20) DEFAULT '#630E14',
                secondary_color VARCHAR(20) DEFAULT '#C5A028',
                template_id VARCHAR(20) DEFAULT 'citaplanner',
                slogan TEXT,
                about_text TEXT,
                address TEXT,
                contact_phone VARCHAR(20),
                hero_image_url TEXT,
                organization_id VARCHAR(50) UNIQUE DEFAULT 'demo',
                features JSONB DEFAULT '{"ai": true, "inventory": true, "marketing": true}'
            );
        `);

        // 1. Fundamental Tables (Expanded for Modo Dios)
        await client.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id VARCHAR(50) DEFAULT 'demo',
                name VARCHAR(100) NOT NULL,
                subdomain VARCHAR(50) NOT NULL,
                custom_domain VARCHAR(255),
                status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL
                plan_type VARCHAR(20) DEFAULT 'ELITE',
                features JSONB DEFAULT '{"ai_scheduler": true, "marketing_pro": true, "inventory_advanced": true, "analytics_nexus": true}',
                openpay_id VARCHAR(100),
                suspended_at TIMESTAMP,
                trial_ends_at TIMESTAMP,
                last_login_at TIMESTAMP,
                bridge_enabled BOOLEAN DEFAULT FALSE,
                bridge_webhook_url TEXT,
                bridge_api_key UUID DEFAULT gen_random_uuid(),
                bridge_satellite_id INTEGER DEFAULT 3,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(id),
                plan_id VARCHAR(50),
                status VARCHAR(20) DEFAULT 'INACTIVE',
                provider VARCHAR(20) DEFAULT 'MERCADOPAGO',
                external_id VARCHAR(100),
                current_period_start TIMESTAMP,
                current_period_end TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS billing_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(id),
                amount DECIMAL(12, 2),
                currency VARCHAR(10) DEFAULT 'MXN',
                status VARCHAR(20),
                provider VARCHAR(20),
                description TEXT,
                invoice_url TEXT,
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
            INSERT INTO tenants(name, subdomain, status, plan_type, organization_id)
            VALUES('Aurum Global Nexus', 'master', 'ACTIVE', 'LEGACY', 'master') 
            ON CONFLICT(subdomain) DO UPDATE SET organization_id = 'master', name = EXCLUDED.name 
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

        // 6. User Seeding & Persistence
        // We ensure critical users (Nexus & QHosting) exist regardless of previous state

        // Nexus God Mode (Master Overseer)
        const nexusExists = await client.query("SELECT id FROM users WHERE phone = 'nexus' AND organization_id = 'master'");
        if (nexusExists.rows.length === 0) {
            console.log("🛠️ Seeding Nexus Superintendent...");
            await client.query(`
                INSERT INTO users(name, phone, email, password, role, branch_id, tenant_id, organization_id, preferences)
                VALUES('Superintendente Nexus', 'nexus', 'nexus@aurum.ai', $1, 'GOD_MODE', $2, $3, 'master', '{"whatsapp":true,"email":true}')
            `, [bcrypt.hashSync('nexus123', 10), defaultBranchId, masterId]);
        }

        // Default Admin (Demo Tenant)
        const adminPhone = process.env.SEED_ADMIN_PHONE || 'admin';
        const adminExists = await client.query("SELECT id FROM users WHERE phone = $1 AND organization_id = 'demo'", [adminPhone]);
        if (adminExists.rows.length === 0) {
            console.log(`🛠️ Seeding Default Admin (${adminPhone})...`);
            await client.query(`
                INSERT INTO users(name, phone, email, password, role, branch_id, tenant_id, organization_id, preferences)
                VALUES($1, $2, $3, $4, 'ADMIN', $5, $6, 'demo', '{"whatsapp":true,"email":true}')
            `, [
                process.env.SEED_ADMIN_NAME || 'Admin Master',
                adminPhone,
                process.env.SEED_ADMIN_EMAIL || 'admin@aurum.ai',
                bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || '123', 10),
                defaultBranchId,
                masterId
            ]);
        }

        // QHOSTING ADMIN (UPSERT LOGIC)
        if (process.env.QHOSTING_ADMIN_PHONE) {
            const existingQAdmin = await client.query("SELECT id FROM users WHERE phone = $1 AND organization_id = 'demo'", [process.env.QHOSTING_ADMIN_PHONE]);

            if (existingQAdmin.rows.length === 0) {
                console.log("🛠️ Seeding QHosting Admin...");
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




        // 7. Shula Studio High-Authority Seeding
        const shulaExists = await client.query("SELECT id FROM tenants WHERE subdomain = 'shula'");
        if (shulaExists.rows.length === 0) {
            console.log("🛠️ Seeding Shula Studio Global (Premium Domain Optimized)...");
            const shulaIdRes = await client.query(`
                INSERT INTO tenants(name, subdomain, custom_domain, status, plan_type, organization_id)
                VALUES('Shula Studio Global', 'shula', 'shulastudio.com', 'ACTIVE', 'ELITE', 'shula')
                RETURNING id
            `);
            const shulaId = shulaIdRes.rows[0].id;

            // Seed Shula Landing
            await client.query(`
                INSERT INTO landing_settings(organization_id, business_name, primary_color, secondary_color, slogan, about_text, template_id, contact_phone, hero_image_url)
                VALUES('shula', 'Shula Studio Global', '#D4AF37', '#000000', 'Elegancia en cada detalle de tu mirada', 
                'En Shula Studio, transformamos la belleza en una experiencia de lujo. Expertos en extensiones de pestañas y diseño de cejas.', 
                'beauty', '+52 55 1234 5678', 'https://images.unsplash.com/photo-1522335718011-7f3bc8fba899')
                ON CONFLICT(organization_id) DO NOTHING
            `);

            // Seed Shula Branch
            await client.query(`
                INSERT INTO branches(name, organization_id, tenant_id)
                VALUES('Shula Studio Matriz', 'shula', $1)
            `, [shulaId]);
        }

        console.log("✅ Infraestructura Aurum Nexus v5.2 Operativa.");
    } catch (e) {
        console.error("❌ Error en initDB:", e.message);
    } finally {
        client.release();
    }
};


const tenantMiddleware = async (req, res, next) => {
    try {
        const host = (req.headers.host || '').toLowerCase();
        let tenantId = 'demo';

        // 1. Hybrid Detection: Subdomains
        if (host.endsWith(ROOT_DOMAIN) && host !== ROOT_DOMAIN && host !== `www.${ROOT_DOMAIN}`) {
            const subdomain = host.replace(`.${ROOT_DOMAIN}`, '').replace('www.', '');
            if (subdomain) tenantId = subdomain;
        }
        // 2. High Authority Detection: Custom Domains (e.g. shulastudio.com)
        else if (host !== ROOT_DOMAIN && host !== `www.${ROOT_DOMAIN}` && host !== 'localhost' && !host.includes('127.0.0.1') && !host.includes('easypanel')) {
            const tenant = await prisma.tenant.findUnique({
                where: { customDomain: host },
                select: { subdomain: true }
            });

            if (tenant) {
                tenantId = tenant.subdomain;
            } else {
                tenantId = req.headers['x-tenant-id'] || 'demo';
            }
        } else {
            tenantId = req.headers['x-tenant-id'] || 'demo';
        }

        req.tenantId = tenantId;
        req.branchId = req.headers['x-branch-id'];

        next();
    } catch (e) {
        console.error("Middleware Error:", e);
        next();
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

// --- SAAS PLANS CONFIGURATION ---
app.get('/api/saas/plans', (req, res) => {
    res.json(SAAS_PLANS);
});

// --- SAAS TENANT MANAGEMENT (GOD MODE ONLY) ---

app.get('/api/saas/tenants', authenticateToken, checkGodMode, async (req, res) => {
    try {
        console.log(`[MASTER] Global Tenant List requested by: ${req.user.phone} (${req.user.id})`);
        // We include subscriptions but use a try-catch for safety during migrations
        const tenants = await prisma.tenant.findMany({
            include: {
                subscriptions: true
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[MASTER] Found ${tenants.length} tenants in database.`);
        res.json(tenants);
    } catch (e) {
        console.error(`[MASTER ERROR] Failed to fetch tenants:`, e);
        // Fallback: try without relations if schema is in flux
        try {
            const basicTenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
            return res.json(basicTenants);
        } catch (e2) {
            res.status(500).json({ error: e.message });
        }
    }
});

// --- SAAS GLOBAL ANALYTICS (GOD MODE) ---
app.get('/api/saas/stats', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const totalTenants = await prisma.tenant.count();
        const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ACTIVE' } });

        // Sum revenue from billing logs
        const revenueRes = await prisma.billingLog.aggregate({
            _sum: { amount: true },
            where: { status: 'SUCCESS' }
        });

        // MRR Estimate from active plans
        const activeSubs = await prisma.subscription.findMany({ where: { status: 'ACTIVE' } });
        const mrr = activeSubs.reduce((acc, s) => {
            const plan = SAAS_PLANS.find(p => p.id === s.planId);
            return acc + (Number(plan?.price) || 0);
        }, 0);

        res.json({
            totalTenants,
            activeSubscriptions,
            mrr,
            totalRevenue: revenueRes._sum.amount || 0,
            systemHealth: {
                uptime: '99.98%',
                latency: '12ms',
                nodes: 1
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BILLING LOGS (GOD MODE) ---
app.get('/api/saas/billing/logs', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const logs = await prisma.billingLog.findMany({
            include: { tenant: true },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- TENANT LIFECYCLE (GOD MODE) ---
app.post('/api/saas/tenants/:id/status', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // ACTIVE, SUSPENDED

        const updated = await prisma.tenant.update({
            where: { id },
            data: {
                status,
                suspendedAt: status === 'SUSPENDED' ? new Date() : null
            }
        });

        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/saas/tenants', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { name, subdomain, planType, customDomain } = req.body;

        const existing = await prisma.tenant.findUnique({ where: { subdomain } });
        if (existing) return res.status(400).json({ error: "Subdominio ya en uso" });

        const planRef = SAAS_PLANS.find(p => p.id === planType) || SAAS_PLANS[0];

        const newTenant = await prisma.tenant.create({
            data: {
                name,
                subdomain,
                planType,
                features: planRef.features,
                status: 'ACTIVE',
                organizationId: subdomain,
                customDomain: customDomain || null
            }
        });


        res.json(newTenant);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/saas/tenants/:id/features', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const { features } = req.body;

        const updated = await prisma.tenant.update({
            where: { id },
            data: { features }
        });

        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- OPENPAY INFRASTRUCTURE MONITOR ---
app.get('/api/saas/openpay/plans', authenticateToken, checkGodMode, async (req, res) => {
    try {
        openpay.plans.list({}, (error, list) => {
            if (error) return res.status(500).json({ error: error.description });
            res.json(list);
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- NEXUS IMPERSONATION (SUPPORT BYPASS) ---
app.post('/api/saas/tenants/:id/impersonate', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) return res.status(404).json({ error: "Nodo no encontrado" });

        // Find the owner or a primary admin of this tenant
        const owner = await prisma.user.findFirst({
            where: { organizationId: tenant.subdomain, role: 'STUDIO_OWNER' }
        });

        if (!owner) return res.status(404).json({ error: "No se encontró un administrador para este nodo" });

        console.log(`[MASTER] Impersonating ${owner.phone} for tenant ${tenant.subdomain}`);

        const token = jwt.sign({
            id: owner.id,
            role: owner.role,
            tenantId: tenant.subdomain,
            branchId: owner.branchId,
            isImpersonated: true,
            masterAdminId: req.user.id
        }, JWT_SECRET, { expiresIn: '2h' });

        res.json({ success: true, token, user: owner });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- PUBLIC SAAS REGISTRATION ---

app.post('/api/saas/register', validateRequest(saasRegisterSchema), async (req, res) => {
    try {
        const { name, subdomain, adminPhone, adminEmail, adminPassword } = req.body;

        const existing = await prisma.tenant.findUnique({ where: { subdomain } });
        if (existing) return res.status(400).json({ error: "Este subdominio ya está reservado" });

        // 1. Create Openpay Customer
        let openpayId = null;
        try {
            const customer = await new Promise((resolve, reject) => {
                openpay.customers.create({
                    name: name,
                    email: adminEmail,
                    phone_number: adminPhone,
                    requires_account: false
                }, (error, body) => error ? reject(error) : resolve(body));
            });
            openpayId = customer.id;
        } catch (opErr) {
            console.warn("⚠️ Openpay Customer creation failed, continuing without it:", opErr.description);
        }

        // 2. ACID Transaction: Create Tenant + Default Branch + Admin User
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    subdomain,
                    planType: 'BASIC',
                    features: SAAS_PLANS[0].features,
                    status: 'PENDINGPAYMENT',
                    organizationId: subdomain,
                    openpayId
                }
            });


            const branch = await tx.branch.create({
                data: {
                    name: "Sucursal Principal",
                    tenantId: tenant.id,
                    organizationId: subdomain
                }
            });

            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const user = await tx.user.create({
                data: {
                    name: "Administrador de " + name,
                    phone: adminPhone,
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'STUDIO_OWNER',
                    branchId: branch.id,
                    organizationId: subdomain
                }
            });

            return { tenant, user };
        });

        res.json({ success: true, message: "Estudio creado con éxito", tenantId: result.tenant.id });

    } catch (e) {
        console.error("Registration Error:", e);
        res.status(500).json({ error: "Falla en el aprovisionamiento masivo: " + e.message });
    }
});


app.post('/api/saas/subscribe', authenticateToken, async (req, res) => {
    try {
        const { planId, provider = 'MERCADOPAGO' } = req.body;
        const plan = SAAS_PLANS.find(p => p.id === planId);

        if (!plan) return res.status(400).json({ error: "Plan inválido" });

        const user = await prisma.user.findFirst({ where: { id: req.user.id } });
        const payerEmail = user?.email || "test_user@test.com";

        if (provider === 'OPENPAY') {
            // Openpay Checkout logic
            const chargeRequest = {
                method: 'card',
                amount: plan.price,
                description: `Suscripción CitaPlanner - ${plan.title}`,
                order_id: `CP-${Date.now()}`,
                customer: {
                    name: user?.name || 'Cliente SaaS',
                    email: payerEmail,
                    phone_number: user?.phone || '0000000000'
                },
                send_email: true,
                confirm: false,
                redirect_url: `${process.env.ROOT_DOMAIN}/settings?status=success`
            };

            return openpay.charges.create(chargeRequest, async (error, charge) => {
                if (error) return res.status(500).json({ error: error.description });

                // Save PENDING Subscription
                await prisma.subscription.create({
                    data: {
                        tenantId: req.user.tenantId,
                        planId: plan.id,
                        status: 'PENDING',
                        provider: 'OPENPAY',
                        externalId: charge.id,
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });

                res.json({ id: charge.id, init_point: charge.payment_method.url });
            });
        }

        // Mercado Pago Logic (Refactored for externalId)
        if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith('TEST-0000')) {
            return res.json({ id: "mock_id", init_point: "#/mock-checkout" });
        }

        const preapproval = new PreApproval(mpClient);
        const result = await preapproval.create({
            body: {
                reason: `Suscripción CitaPlanner - ${plan.title}`,
                external_reference: req.user.tenantId || "demo",
                payer_email: payerEmail,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.price,
                    currency_id: 'MXN'
                },
                back_url: `${ROOT_DOMAIN}/settings?status=success`,
                status: 'pending'
            }
        });

        await prisma.subscription.create({
            data: {
                tenantId: req.user.tenantId,
                planId: plan.id,
                status: 'PENDING',
                provider: 'MERCADOPAGO',
                externalId: result.id,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        res.json({ id: result.id, init_point: result.init_point });

    } catch (e) {
        console.error("❌ SaaS Sub Error:", e);
        res.status(500).json({ error: "Error al iniciar suscripción" });
    }
});




app.post('/api/saas/webhook', async (req, res) => {
    const { type, data, action } = req.body;

    // Respond fast to avoid timeouts
    res.status(200).json({ received: true });

    // Handle Subscription Logic (PreApproval)
    if (type === 'subscription_preapproval' || (data && data.id && !type)) {
        // Sometimes webhooks come with just data.id for subscriptions
        const preapprovalId = data?.id;
        if (!preapprovalId) return;

        try {
            console.log(`🔔 Webhook Sub ID: ${preapprovalId}`);
            const preapproval = new PreApproval(mpClient);
            const subData = await preapproval.get({ id: preapprovalId });

            if (!subData) return;

            const { status, external_reference } = subData;

            // ACID Transaction for Subscription Activation
            if (status === 'authorized') {
                await prisma.$transaction(async (tx) => {
                    const pendingSub = await tx.subscription.findUnique({
                        where: { externalId: preapprovalId }
                    });

                    if (pendingSub) {
                        // Activate Subscription
                        await tx.subscription.update({
                            where: { id: pendingSub.id },
                            data: { status: 'ACTIVE' }
                        });

                        // Create Billing Log
                        await tx.billingLog.create({
                            data: {
                                tenantId: pendingSub.tenantId,
                                amount: SAAS_PLANS.find(p => p.id === pendingSub.planId)?.price || 0,
                                status: 'SUCCESS',
                                provider: 'MERCADOPAGO',
                                description: `Pago Suscripción ${pendingSub.planId}`
                            }
                        });

                        // Upgrade Tenant
                        const planRef = SAAS_PLANS.find(p => p.id === pendingSub.planId) || SAAS_PLANS[0];
                        await tx.tenant.update({
                            where: { id: pendingSub.tenantId },
                            data: {
                                planType: pendingSub.planId,
                                features: planRef.features,
                                status: 'ACTIVE' // Ensure tenant is active
                            }
                        });
                        console.log(`✅ Subscription Authorized for Tenant: ${pendingSub.tenantId}`);
                    }
                });
            }
        } catch (e) {
            console.error("❌ Sub Webhook Error:", e);
        }
        return;
    }

    // Handle Payments (Invoice Paid)
    if (type === 'payment' && data?.id) {
        try {
            console.log(`🔔 Webhook Payment ID: ${data.id}`);
            const paymentClient = new Payment(mpClient);
            const payment = await paymentClient.get({ id: data.id });

            if (!payment) return;

            const { status, transaction_amount, external_reference } = payment;

            // Log Transaction (ACID not strictly needed for just logging, but good practice if linking)
            await prisma.transaction.create({
                data: {
                    mpPaymentId: String(data.id),
                    mpStatus: status,
                    amount: transaction_amount,
                    organizationId: external_reference || 'demo'
                }
            });

            // WebSocket Notification for Payment
            emitTenantEvent(external_reference || 'demo', 'payment-confirmed', { status, amount: transaction_amount, id: data.id });

            console.log(`💰 Payment Recorded: ${status}`);

        } catch (e) {
            console.error("❌ Pay Webhook Error:", e);
        }
    }
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

app.post('/api/saas/openpay/webhook', async (req, res) => {
    try {
        const { type, transaction } = req.body;
        console.log(`[OPENPAY WEBHOOK] Event: ${type} | Trans: ${transaction?.id}`);

        if (type === 'verification') return res.status(200).send();
        if (!transaction) return res.status(200).send();

        if (type === 'charge.succeeded') {
            await prisma.$transaction(async (tx) => {
                const pendingSub = await tx.subscription.findUnique({
                    where: { externalId: transaction.id }
                });

                if (pendingSub) {
                    // Activate Subscription
                    await tx.subscription.update({
                        where: { id: pendingSub.id },
                        data: { status: 'ACTIVE' }
                    });

                    // Create Billing Log
                    await tx.billingLog.create({
                        data: {
                            tenantId: pendingSub.tenantId,
                            amount: transaction.amount,
                            status: 'SUCCESS',
                            provider: 'OPENPAY',
                            description: `Pago Openpay - ${transaction.description}`
                        }
                    });

                    // Upgrade Tenant
                    const planRef = SAAS_PLANS.find(p => p.id === pendingSub.planId) || SAAS_PLANS[0];
                    await tx.tenant.update({
                        where: { id: pendingSub.tenantId },
                        data: {
                            planType: pendingSub.planId,
                            features: planRef.features,
                            status: 'ACTIVE'
                        }
                    });
                    console.log(`✅ Openpay Sub Activated for Tenant: ${pendingSub.tenantId}`);
                }
            });
        }

        res.status(200).send();
    } catch (e) {
        console.error("❌ Openpay Webhook Error:", e);
        res.status(500).send();
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

        // Notify Google Calendar
        syncToGoogleCalendar(newAppointment);

        // Real-time Update via Socket.io
        emitTenantEvent(req.tenantId, 'new-appointment', newAppointment);

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

// --- CALENDAR INTEGRATION ENDPOINTS ---

app.get('/api/professionals/:id/calendar/link', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const professional = await prisma.professional.findUnique({ where: { id } });
        if (!professional) return res.status(404).json({ error: "Profesional no encontrado" });

        if (!professional.icalToken) {
            await prisma.professional.update({
                where: { id },
                data: { icalToken: Array.from(Array(24), () => Math.floor(Math.random() * 36).toString(36)).join('') }
            });
        }

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/calendar.events'],
            state: id
        });

        res.json({ url, icalToken: professional.icalToken || 'pending' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        await prisma.professional.update({
            where: { id: state },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                calendarSyncEnabled: true
            }
        });
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #2e7d32;">✅ Sincronización Exitosa</h1>
                <p>Tu calendario de Google ha sido vinculado correctamente con CitaPlanner.</p>
                <p>Puedes cerrar esta pestaña y regresar al dashboard.</p>
            </div>
        `);
    } catch (e) { res.status(500).send("Error en callback de Google: " + e.message); }
});

app.get('/api/calendar/feed/:token.ics', async (req, res) => {
    try {
        const { token } = req.params;
        const professional = await prisma.professional.findUnique({
            where: { icalToken: token },
            include: { appointments: true }
        });

        if (!professional) return res.status(404).send('Feed no encontrado');

        const events = professional.appointments.map(app => {
            const startStr = app.startDateTime.toISOString();
            const endStr = app.endDateTime.toISOString();
            const s = new Date(startStr);
            const e = new Date(endStr);

            return {
                start: [s.getFullYear(), s.getMonth() + 1, s.getDate(), s.getHours(), s.getMinutes()],
                end: [e.getFullYear(), e.getMonth() + 1, e.getDate(), e.getHours(), e.getMinutes()],
                title: app.title,
                description: `Cliente: ${app.clientName}\nNotas: ${app.notes || ''} `,
                status: 'CONFIRMED',
                busyStatus: 'BUSY'
            };
        });

        const { error, value } = ics.createEvents(events);
        if (error) throw error;

        res.set('Content-Type', 'text/calendar');
        res.send(value);
    } catch (e) { res.status(500).send(e.message); }
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

        let user = await prisma.user.findFirst({ where: { phone, organizationId: req.tenantId } });

        // Fallback for Global SuperAdmin (nexus) if logging in from root domain
        if (!user && (req.tenantId === 'demo' || !req.tenantId) && phone === 'nexus') {
            console.log(`[AUTH DEBUG] Global Admin detected, redirecting search to 'master' tenant`);
            user = await prisma.user.findFirst({ where: { phone, organizationId: 'master' } });
        }

        console.log(`[AUTH DEBUG] User Found: ${user ? 'YES' : 'NO'} (ID: ${user?.id})`);

        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

            // Use the user's actual organizationId for the token/session to represent their identity accurately
            const userTenantId = user.organizationId || req.tenantId;

            console.log(`[AUTH] Success for: ${phone} | Assigned Tenant: ${userTenantId}`);

            const token = jwt.sign({
                id: user.id,
                role: user.role,
                tenantId: userTenantId,
                branchId: user.branchId
            }, JWT_SECRET, { expiresIn: '1h' });

            const refreshToken = jwt.sign({
                id: user.id,
                role: user.role,
                tenantId: userTenantId
            }, JWT_SECRET, { expiresIn: '7d' });

            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken }
            });

            const mappedUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                branchId: user.branchId,
                relatedId: user.relatedId,
                tenantId: userTenantId // CRITICAL: Frontend needs this to know its current tenant context
            };

            res.json({ success: true, token, refreshToken, user: mappedUser });
        } else {

            console.warn(`[AUTH] Failed for: ${phone} `);
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
    } catch (e) {
        console.error('[AUTH] DB Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- GOOGLE CALENDAR HELPERS ---
async function syncToGoogleCalendar(appointment) {
    if (!appointment.professionalId) return;
    try {
        const professional = await prisma.professional.findUnique({
            where: { id: appointment.professionalId }
        });
        if (!professional || !professional.calendarSyncEnabled || !professional.googleRefreshToken) return;

        const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
        auth.setCredentials({ refresh_token: professional.googleRefreshToken });

        const calendar = google.calendar({ version: 'v3', auth });
        await calendar.events.insert({
            calendarId: professional.googleCalendarId || 'primary',
            requestBody: {
                summary: `Cita: ${appointment.title} `,
                description: `Cliente: ${appointment.clientName}\nNotas: ${appointment.notes || ''} `,
                start: { dateTime: appointment.startDateTime.toISOString() },
                end: { dateTime: appointment.endDateTime.toISOString() }
            }
        });
        console.log(`✅ Google Sync Success for App: ${appointment.id} `);
    } catch (e) {
        console.error("❌ Google Sync Error:", e.message);
    }
}


// --- AUTH ENDPOINTS (REFRESH & RESET) ---

app.post('/api/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh Token requerido" });

    try {
        const payload = jwt.verify(refreshToken, JWT_SECRET);

        const user = await prisma.user.findFirst({
            where: { id: payload.id, refreshToken: refreshToken }
        });

        if (!user) return res.status(403).json({ error: "Refresh Token inválido o revocado" });

        // Issue new Access Token
        const newToken = jwt.sign({
            id: user.id,
            role: user.role,
            tenantId: payload.tenantId,
            branchId: user.branchId // Assuming branch stays same
        }, JWT_SECRET, { expiresIn: '15m' });

        res.json({ success: true, token: newToken });

    } catch (e) {
        return res.status(403).json({ error: "Token inválido/expirado" });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email, tenantId } = req.body;
    // Check tenant context if needed, or find user globally. 
    // Usually user is unique by (phone/email, organizationId).
    // Modest assumption: email is unique per tenant.

    try {
        const user = await prisma.user.findFirst({
            where: {
                email,
                organizationId: tenantId || req.tenantId || 'demo'
            }
        });

        if (!user) {
            // Fake success to prevent enumeration
            return res.json({ success: true, message: "Si el correo existe, se enviarán instrucciones." });
        }

        // Generate Reset Token (Random string)
        const resetToken = Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
        const expires = new Date(Date.now() + 3600000); // 1 Hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry: expires
            }
        });

        const resetLink = `https://${req.headers.host}/reset-password?token=${resetToken}&email=${email}`;

        await sendEmail(email, "Recuperación de Contraseña - CitaPlanner",
            `<p>Hola ${user.name},</p><p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p><a href="${resetLink}">${resetLink}</a><p>Expira en 1 hora.</p>`,
            user.branchId
        );

        res.json({ success: true, message: "Enlace enviado." });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                email,
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) return res.status(400).json({ error: "Token inválido o expirado" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ success: true, message: "Contraseña actualizada correctamente" });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const branchKey = req.branchId || 'global';
        const products = await getCached(`products:${req.tenantId}:${branchKey} `, async () => {
            const where = {
                organizationId: req.tenantId
            };
            if (req.branchId) {
                where.branchId = req.branchId;
            }
            const rawProducts = await prisma.product.findMany({
                where,
                orderBy: { name: 'asc' }
            });
            return rawProducts.map(p => ({
                ...p,
                price: p.price ? parseFloat(p.price.toString()) : 0,
                stock: p.stock || 0
            }));
        });
        res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await getCached(`services:${req.tenantId} `, async () => {
            const rawServices = await prisma.service.findMany({
                where: { organizationId: req.tenantId },
                orderBy: { name: 'asc' }
            });
            return rawServices.map(s => ({
                ...s,
                price: s.price ? parseFloat(s.price.toString()) : 0
            }));
        });
        res.json(services);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/services', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, duration, price, category, status, description, imageUrl, tenantId } = req.body;

        // Ensure tenantId matches (security)
        const targetTenant = req.user.role === 'GOD_MODE' ? (tenantId || req.tenantId) : req.tenantId;

        const newService = await prisma.service.create({
            data: {
                name,
                duration: parseInt(duration),
                price: parseFloat(price),
                category,
                status,
                description,
                imageUrl,
                organizationId: targetTenant,
                tenantId: targetTenant // Linking both for now as per schema confusion
            }
        });

        // Invalidate Cache
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`services:${targetTenant} `);
        }

        res.json({ success: true, service: newService });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/services/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, duration, price, category, status, description, imageUrl } = req.body;

        const updatedService = await prisma.service.update({
            where: { id },
            data: {
                name,
                duration: parseInt(duration),
                price: parseFloat(price),
                category,
                status,
                description,
                imageUrl
            }
        });

        // Invalidate Cache
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`services:${req.tenantId} `);
        }

        res.json({ success: true, service: updatedService });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/services/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.service.delete({
            where: { id }
        });

        // Invalidate Cache
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`services:${req.tenantId} `);
        }

        res.json({ success: true });
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

// --- SAAS PLANS CONFIGURATION ---

app.get('/api/settings/landing', async (req, res) => {
    try {
        const organizationId = req.tenantId || 'demo';
        let data = await prisma.landingSetting.findUnique({
            where: { organizationId }
        });

        // Initialize default if not exists
        if (!data) {
            data = await prisma.landingSetting.create({
                data: {
                    organizationId,
                    businessName: organizationId === 'demo' ? 'CitaPlanner Elite' : organizationId.toUpperCase(),
                    primaryColor: '#630E14',
                    secondaryColor: '#C5A028',
                    templateId: 'citaplanner',
                    slogan: 'Gestión de Lujo Simplificada'
                }
            });
        }

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

app.put('/api/settings/landing', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const organizationId = req.tenantId;
        const settings = req.body;

        const updated = await prisma.landingSetting.upsert({
            where: { organizationId },
            update: {
                businessName: settings.businessName,
                primaryColor: settings.primaryColor,
                secondaryColor: settings.secondaryColor,
                templateId: settings.templateId,
                slogan: settings.slogan,
                aboutText: settings.aboutText,
                address: settings.address,
                contactPhone: settings.contactPhone,
                heroImageUrl: settings.heroImageUrl
            },
            create: {
                organizationId,
                businessName: settings.businessName,
                primaryColor: settings.primaryColor,
                secondaryColor: settings.secondaryColor,
                templateId: settings.templateId,
                slogan: settings.slogan,
                aboutText: settings.aboutText,
                address: settings.address,
                contactPhone: settings.contactPhone,
                heroImageUrl: settings.heroImageUrl
            }
        });

        res.json({ success: true, settings: updated });
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
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://${ROOT_DOMAIN}:${PORT}`);
            console.log(`📡 WebSockets enabled on same port`);
        });
    });
}

export { app };
