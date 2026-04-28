import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import crypto from 'crypto';
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
import { GoogleGenerativeAI } from "@google/generative-ai";
import cron from 'node-cron';
import multer from 'multer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY || "");

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
const BRAND_NAME = process.env.BRAND_NAME || 'CitaPlanner';
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const SYSTEM_VERSION = pkg.version;
console.log(`\n🚀 [${BRAND_NAME.toUpperCase()}] Starting SaaS Engine v${SYSTEM_VERSION}\n`);

// PERSISTENCIA: Asegurar que la carpeta de uploads exista
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('📁 [NEXUS] Carpeta /uploads creada (necesaria para el montaje de volumen).');
}

async function ensureSchemaIntegrity() {
    console.log("🛠️ [NEXUS] Checking database schema integrity...");
    const { execSync } = await import('child_process');

    try {
        // Verificar si la tabla fundamental existe
        await prisma.tenant.findFirst().catch(async (err) => {
            if (err.code === 'P2021') {
                console.log("⚠️ [NEXUS] Tablas no encontradas. Iniciando sincronización automática...");
                execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
                console.log("✅ [NEXUS] Sincronización de tablas completada.");
            }
        });

        // Add columns if missing in appointments table
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                -- Solo intentar si la tabla existe
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='appointments') THEN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professional_id') THEN
                        ALTER TABLE appointments ADD COLUMN professional_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='service_id') THEN
                        ALTER TABLE appointments ADD COLUMN service_id UUID;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reminder_sent') THEN
                        ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='care_sent') THEN
                        ALTER TABLE appointments ADD COLUMN care_sent BOOLEAN DEFAULT FALSE;
                    END IF;
                END IF;

                -- Solo intentar si la tabla existe
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='landing_settings') THEN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='landing_settings' AND column_name='hero_video_url') THEN
                        ALTER TABLE landing_settings ADD COLUMN hero_video_url TEXT;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='landing_settings' AND column_name='service_ids') THEN
                        ALTER TABLE landing_settings ADD COLUMN service_ids JSONB DEFAULT '[]';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='landing_settings' AND column_name='product_ids') THEN
                        ALTER TABLE landing_settings ADD COLUMN product_ids JSONB DEFAULT '[]';
                    END IF;
                END IF;
            END $$;
        `);
        console.log("✅ [NEXUS] Database schema integrity verified.");
    } catch (e) {
        if (e.message.includes('relation') && e.message.includes('does not exist')) {
            console.log("ℹ️ [NEXUS] Base de datos nueva detectada. Saltando verificación de integridad (Tablas aún no creadas).");
        } else {
            console.error("❌ [NEXUS] Schema integrity check failed:", e.message);
        }
    }
}


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
const WAHA_OTP_SESSION = process.env.WAHA_OTP_SESSION || 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';

// --- SAAS PLANS (DYNAMIC) ---
const PLANS_FILE = path.join(__dirname, 'saas_plans.json');

let SAAS_PLANS = [
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

// Load plans from disk if exists
try {
    if (fs.existsSync(PLANS_FILE)) {
        const raw = fs.readFileSync(PLANS_FILE, 'utf-8');
        SAAS_PLANS = JSON.parse(raw);
        console.log(`✅ ${SAAS_PLANS.length} Planes cargados desde disco.`);
    }
} catch (e) {
    console.warn("⚠️ Error cargando planes, usando defaults:", e.message);
}

const savePlans = () => {
    try {
        fs.writeFileSync(PLANS_FILE, JSON.stringify(SAAS_PLANS, null, 2));
    } catch (e) {
        console.error("❌ Error guardando planes:", e.message);
    }
};



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

const sendWhatsAppMessage = async (phone, text, branchId, organizationId) => {
    if (!phone) return;
    try {
        // WAHA requires formatted phone numbers (e.g. 52155...)
        // This is a simplified implementation
        const chatId = `${phone.replace(/\D/g, '')}@c.us`;

        console.log(`📨 Sending WhatsApp to ${chatId}: ${text}`);

        await axios.post(`${WAHA_URL}/api/sendText`, {
            chatId: chatId,
            text: text,
            session: WAHA_OTP_SESSION
        }, {
            headers: WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {}
        });

        await prisma.integrationLog.create({
            data: {
                platform: 'WHATSAPP',
                eventType: 'SEND_MESSAGE',
                payload: { chatId, text },
                response: 'Sent',
                status: 'SUCCESS',
                branchId,
                organizationId
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
                branchId,
                organizationId
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

const sendEmail = async (to, subject, html, branchId, organizationId) => {
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
                branchId,
                organizationId
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
                branchId,
                organizationId
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    fallthrough: true // Allow proceeding to our custom 404 handler below
}), (req, res) => {
    // If we reach here, express.static didn't find the file
    res.status(404).send('Archivo no encontrado en el servidor de CitaPlanner');
});

app.use(express.static(path.join(__dirname, 'dist')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for high-quality videos/images
});

app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});



const tenantMiddleware = async (req, res, next) => {
    try {
        const fullHost = (req.headers.host || '').toLowerCase();
        const host = fullHost.split(':')[0];
        let subdomain = 'demo';

        if (req.path.includes('/api/settings/landing')) {
            console.log(`[TENANT DEBUG] Host: ${host} | ROOT_DOMAIN: ${ROOT_DOMAIN}`);
        }

        // 0. Single-Tenant Override (If ORGANIZATION_ID is set in .env)
        const SYSTEM_ORG_ID = process.env.ORGANIZATION_ID || 'demo';
        
        if (process.env.ORGANIZATION_ID) {
            subdomain = SYSTEM_ORG_ID;
        } 
        // 1. Master Hub Detection
        else if (host === `master.${ROOT_DOMAIN}`) {
            subdomain = 'master';
        }
        // 2. Subdomain Detection (e.g., shula.citaplanner.com)
        else if (host.endsWith(ROOT_DOMAIN) && host !== ROOT_DOMAIN && host !== `www.${ROOT_DOMAIN}`) {
            subdomain = host.replace(`.${ROOT_DOMAIN}`, '').replace('www.', '');
        }
        // 3. Custom Domain Detection (e.g., shulastudio.com)
        else if (host !== ROOT_DOMAIN && host !== `www.${ROOT_DOMAIN}` && host !== 'localhost' && !host.includes('127.0.0.1') && !host.includes('easypanel')) {
            const cleanHost = host.replace('www.', '');
            const tenant = await getCached(`domain:${cleanHost}`, () => prisma.tenant.findFirst({
                where: { OR: [{ customDomain: host }, { customDomain: cleanHost }] },
                select: { subdomain: true }
            }), 3600);

            if (tenant) {
                subdomain = tenant.subdomain;
            } else {
                subdomain = req.headers['x-tenant-id'] || SYSTEM_ORG_ID;
            }
        } else {
            subdomain = req.headers['x-tenant-id'] || SYSTEM_ORG_ID;
        }

        // Resolve Tenant UUID and Object
        const tenant = await getCached(`tenant_obj:${subdomain}`, () => prisma.tenant.findUnique({
            where: { subdomain }
        }), 600);

        req.tenant = tenant;
        req.tenantId = subdomain; // Legacy slug
        req.tenantUuid = tenant?.id; // Actual DB UUID
        req.organizationId = subdomain; // Legacy slug for queries
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

app.get('/api/branches', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { organizationId: req.organizationId || 'demo' },
            orderBy: { createdAt: 'asc' }
        });
        res.json(branches);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/branches', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, address, phone, manager } = req.body;
        const branch = await prisma.branch.create({
            data: {
                name,
                address: address || '',
                phone: phone || '',
                manager: manager || '',
                status: 'ACTIVE',
                organizationId: req.organizationId || 'demo'
            }
        });
        res.json(branch);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/branches/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, address, phone, manager, status } = req.body;
        const branch = await prisma.branch.update({
            where: { id: req.params.id },
            data: { name, address, phone, manager, status }
        });
        res.json(branch);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/branches/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        await prisma.branch.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- SALES MANAGEMENT ---
app.get('/api/sales', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const sales = await prisma.sale.findMany({
            where: { tenantId: req.tenantUuid || undefined, organizationId: req.organizationId || 'demo' },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(sales);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SAAS TENANT MANAGEMENT (GOD MODE ONLY) ---

app.get('/api/saas/tenants/debug-raw', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ count: tenants.length, rows: tenants });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

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
        console.error(`[MASTER ERROR] Failed to fetch tenants: `, e);
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
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - start;

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
                uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
                latency: `${dbLatency}ms`,
                nodeVersion: process.version,
                memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
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

app.delete('/api/saas/tenants/:id', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        // Basic protection: don't delete 'master' via API easily if logic requires it
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (tenant?.subdomain === 'master') return res.status(403).json({ error: "No se puede destruir el nodo Nexus Core" });

        await prisma.tenant.delete({ where: { id } });
        res.json({ success: true, message: "Nodo destruido de la infraestructura" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CLUSTER CLOUD LOGS (AUDIT) ---
app.get('/api/saas/logs', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { platform, organizationId, level } = req.query;
        const where = {};
        if (platform) where.platform = platform;
        if (organizationId) where.organizationId = organizationId;
        if (level) where.status = level;

        const logs = await prisma.integrationLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DEEP SYSTEM HEALTH ---
app.get('/api/saas/health/deep', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - start;

        const tenantCount = await prisma.tenant.count();

        res.json({
            status: 'HEALTHY',
            database: {
                connected: true,
                latency: `${dbLatency} ms`,
                tenants: tenantCount
            },
            engine: {
                version: 'Aurum Nexus v5.3',
                uptime: process.uptime()
            }
        });
    } catch (e) { res.status(500).json({ status: 'DEGRADED', error: e.message }); }
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

        // Cascade: find the best available user for this tenant
        let owner = await prisma.user.findFirst({
            where: { organizationId: tenant.subdomain, role: 'STUDIO_OWNER' }
        });
        if (!owner) {
            owner = await prisma.user.findFirst({
                where: { organizationId: tenant.subdomain, role: 'GOD_MODE' }
            });
        }
        if (!owner) {
            owner = await prisma.user.findFirst({
                where: { organizationId: tenant.subdomain, role: 'ADMIN' }
            });
        }
        if (!owner) {
            // Last resort: grab any user in this tenant
            owner = await prisma.user.findFirst({
                where: { organizationId: tenant.subdomain }
            });
        }

        if (!owner) return res.status(404).json({ error: `No se encontraron usuarios registrados en el nodo '${tenant.subdomain}'.Crea un administrador primero.` });

        console.log(`[MASTER] Impersonating ${owner.phone} (role: ${owner.role}) for tenant ${tenant.subdomain}`);

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

// --- TENANT ADMIN MANAGEMENT (GOD MODE) ---
app.get('/api/saas/tenants/:id/admins', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) return res.status(404).json({ error: "Nodo no encontrado" });

        const users = await prisma.user.findMany({
            where: { organizationId: tenant.subdomain },
            select: { id: true, name: true, phone: true, email: true, role: true, branchId: true },
            orderBy: { role: 'asc' }
        });
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/saas/tenants/:id/admins', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) return res.status(404).json({ error: "Nodo no encontrado" });

        const { name, phone, email, password, role } = req.body;
        if (!name || !phone || !password) return res.status(400).json({ error: "Nombre, teléfono y contraseña son requeridos" });

        // Find or create default branch for this tenant
        let branch = await prisma.branch.findFirst({ where: { organizationId: tenant.subdomain } });
        if (!branch) {
            branch = await prisma.branch.create({
                data: { name: "Sucursal Principal", tenantId: tenant.id, organizationId: tenant.subdomain }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email: email || null,
                password: hashedPassword,
                role: role || 'STUDIO_OWNER',
                branchId: branch.id,
                tenantId: tenant.id,
                organizationId: tenant.subdomain
            }
        });

        res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/saas/tenants/:id/admins/:userId', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, phone, email, role, password } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, phone: true, email: true, role: true }
        });

        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/saas/tenants/:id/admins/:userId', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { userId } = req.params;
        await prisma.user.delete({ where: { id: userId } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- SAAS PLANS MANAGEMENT (DYNAMIC) ---

app.get('/api/saas/plans', (req, res) => {
    res.json(SAAS_PLANS);
});

app.post('/api/saas/plans', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id, title, price, currency, description, features } = req.body;
        if (!id || !title || !price) return res.status(400).json({ error: "Datos incompletos" });

        const exists = SAAS_PLANS.find(p => p.id === id);
        if (exists) return res.status(400).json({ error: "ID de plan ya existe" });

        const newPlan = { id, title, price, currency: currency || 'MXN', description, features: features || {} };
        SAAS_PLANS.push(newPlan);
        savePlans();

        res.json({ success: true, plan: newPlan });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/saas/plans/:id', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const index = SAAS_PLANS.findIndex(p => p.id === id);

        if (index === -1) return res.status(404).json({ error: "Plan no encontrado" });

        SAAS_PLANS[index] = { ...SAAS_PLANS[index], ...updates, id }; // Keep ID or allow rename if handled carefully
        savePlans();

        res.json({ success: true, plan: SAAS_PLANS[index] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/saas/plans/:id', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const initialLength = SAAS_PLANS.length;
        SAAS_PLANS = SAAS_PLANS.filter(p => p.id !== id);

        if (SAAS_PLANS.length === initialLength) return res.status(404).json({ error: "Plan no encontrado" });

        savePlans();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- TENANT SUBSCRIPTION MANAGEMENT (MANUAL OVERRIDE) ---
app.put('/api/saas/tenants/:id/subscription', authenticateToken, checkGodMode, async (req, res) => {
    try {
        const { id } = req.params;
        const { planId, status, trialDays } = req.body;

        const updateData = {};
        const plan = SAAS_PLANS.find(p => p.id === planId);

        if (planId) {
            if (!plan) return res.status(400).json({ error: "Plan inválido" });
            updateData.planType = planId;
            updateData.features = plan.features;
        }

        if (status) updateData.status = status;

        if (trialDays !== undefined) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + parseInt(trialDays));
            updateData.trialEndsAt = endDate;
            updateData.status = 'TRIAL'; // Force status to TRIAL if adding days
        }

        const tenant = await prisma.tenant.update({
            where: { id },
            data: updateData
        });

        // Log manual intervention
        await prisma.billingLog.create({
            data: {
                tenantId: id,
                amount: 0,
                status: 'SUCCESS',
                provider: 'MANUAL_ADMIN',
                description: `Ajuste manual: Plan ${planId || '-'} | Status ${status || '-'} | Trial ${trialDays || 0} d`
            }
        });

        res.json({ success: true, tenant });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


app.post('/api/saas/register', authenticateToken, checkGodMode, validateRequest(saasRegisterSchema), async (req, res) => {
    try {
        if (req.tenantId !== 'master') {
            return res.status(403).json({ error: "Creación de tenants solo permitida desde el HUB Master" });
        }
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
                description: `Suscripción CitaPlanner - ${plan.title} `,
                order_id: `CP - ${Date.now()} `,
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
                sendWhatsAppMessage(cleanPhone, "¡Gracias! Tu cita ha sido confirmada.", null, appointment.organizationId);
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

        // ACID Transaction: Create appointment and log integration event
        const newAppointment = await prisma.$transaction(async (tx) => {
            const apt = await tx.appointment.create({
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

            await tx.integrationLog.create({
                data: {
                    platform: 'SYSTEM',
                    eventType: 'APPOINTMENT_CREATED',
                    payload: { appointmentId: apt.id, clientName },
                    status: 'SUCCESS',
                    organizationId: req.tenantId,
                    branchId: req.branchId
                }
            });

            return apt;
        });

        const newId = newAppointment.id;

        // Notify via WhatsApp
        if (clientPhone) {
            const dateStr = new Date(startDateTime).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
            const message = `Hola ${clientName}, tu cita para "${title}" ha sido confirmada para el ${dateStr}. Te esperamos en Aurum.`;
            sendWhatsAppMessage(clientPhone, message, req.branchId, req.tenantId);
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
                const success = await sendEmail(user.email, campaign.subject, campaign.content, req.branchId, req.tenantId);
                if (success) sentCount++;
            } else if (campaign.channel === 'WHATSAPP' && user.phone) {
                // Use existing sendWhatsAppMessage
                await sendWhatsAppMessage(user.phone, campaign.content, req.branchId, req.tenantId);
                sentCount++;
            }
        }

        res.json({ success: true, sentCount, message: `Campaña lanzada a ${sentCount} usuarios.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/integrations/waha/status', async (req, res) => {
    try {
        const response = await axios.get(`${WAHA_URL}/api/sessions`, {
            headers: WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {},
            timeout: 3000
        }).catch(e => ({ status: 500, data: { message: e.message } }));

        if (response.status === 200) {
            const sessions = response.data;
            const activeSession = sessions.find(s => s.name === WAHA_OTP_SESSION);
            res.json({
                success: true,
                sessionName: WAHA_OTP_SESSION,
                status: activeSession ? activeSession.status : 'NOT_FOUND',
                details: activeSession || null
            });
        } else {
            res.json({ 
                success: false, 
                sessionName: WAHA_OTP_SESSION,
                status: 'OFFLINE', 
                message: "No se pudo contactar con el nodo WAHA" 
            });
        }
    } catch (e) { res.json({ success: false, status: 'ERROR', message: e.message }); }
});

app.post('/api/integrations/waha/test', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: "Teléfono requerido" });

        const testMessage = `🚀 *Nexus Diagnostic:* Tu conexión con WAHA (${WAHA_OTP_SESSION}) es EXITOSA. CitaPlanner está listo para operar.`;
        
        await sendWhatsAppMessage(phone, testMessage, null, req.tenantId);
        
        res.json({ success: true, message: "Mensaje de prueba enviado exitosamente" });
    } catch (e) { res.status(500).json({ error: e.message }); }
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

app.get('/api/calendar/tenant/feed/:token.ics', async (req, res) => {
    try {
        const { token } = req.params;
        const tenant = await prisma.tenant.findFirst({
            where: { icalToken: token }
        });

        if (!tenant) return res.status(404).send('Feed de tenant no encontrado');

        const appointments = await prisma.appointment.findMany({
            where: { organizationId: tenant.organizationId || 'demo' },
            include: { professional: true }
        });

        const events = appointments.map(app => {
            const startStr = app.startDateTime.toISOString();
            const endStr = app.endDateTime.toISOString();
            const s = new Date(startStr);
            const e = new Date(endStr);

            return {
                start: [s.getFullYear(), s.getMonth() + 1, s.getDate(), s.getHours(), s.getMinutes()],
                end: [e.getFullYear(), e.getMonth() + 1, e.getDate(), e.getHours(), e.getMinutes()],
                title: `[${app.professional?.name || 'Gral'}] ${app.title}`,
                description: `Cliente: ${app.clientName}\nNotas: ${app.notes || ''}\nAtiende: ${app.professional?.name || 'No asignado'}`,
                status: 'CONFIRMED',
                busyStatus: 'BUSY'
            };
        });

        const { error, value } = ics.createEvents(events);
        if (error) throw error;

        res.set('Content-Type', 'text/calendar; charset=utf-8');
        res.send(value);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/tenants/calendar/link', authenticateToken, async (req, res) => {
    try {
        const tenant = await prisma.tenant.findFirst({
            where: { organizationId: req.tenantId }
        });
        if (!tenant) return res.status(404).json({ error: "Tenant no encontrado" });

        let icalToken = tenant.icalToken;
        if (!icalToken) {
            icalToken = Array.from(Array(24), () => Math.floor(Math.random() * 36).toString(36)).join('');
            await prisma.tenant.update({
                where: { id: tenant.id },
                data: { icalToken }
            });
        }

        res.json({ icalToken });
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
    let { phone, password } = req.body;

    // Auto-trim to avoid copy-paste whitespace issues
    phone = phone?.trim();
    password = password?.trim();

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

        // Search by phone OR email
        let user = await prisma.user.findFirst({
            where: {
                OR: [{ phone }, { email: phone }],
                organizationId: req.tenantId
            }
        });

        // Fallback 1: Try 'demo' org (where seed users live)
        if (!user) {
            user = await prisma.user.findFirst({
                where: {
                    OR: [{ phone }, { email: phone }],
                    organizationId: 'demo'
                }
            });
            if (user) console.log(`[AUTH DEBUG] Found user in 'demo' org fallback`);
        }

        // Fallback 2: GOD_MODE can login from any domain
        if (!user) {
            user = await prisma.user.findFirst({
                where: {
                    OR: [{ phone }, { email: phone }],
                    role: 'GOD_MODE'
                }
            });
            if (user) console.log(`[AUTH DEBUG] GOD_MODE global login detected`);
        }

        console.log(`[AUTH DEBUG] User Found: ${user ? 'YES' : 'NO'} (ID: ${user?.id})`);

        if (user) {
            console.log(`[AUTH DEBUG] Verifying password for user: ${user.phone} (Received length: ${password?.length || 0})`);
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                console.warn(`[AUTH DEBUG] Password mismatch for user: ${user.phone}`);
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            // Normalización para GOD_MODE: Si viene de demo/master, permitirle usar el tenant actual
            let userTenantId = user.organizationId || req.tenantId;
            if (user.role === 'GOD_MODE' && (userTenantId === 'demo' || userTenantId === 'master' || !userTenantId)) {
                userTenantId = req.tenantId || userTenantId || 'master';
            }

            console.log(`[AUTH] Success: ${user.phone} | Role: ${user.role} | Target Tenant: ${userTenantId}`);

            const token = jwt.sign({
                id: user.id,
                role: user.role,
                tenantId: userTenantId,
                branchId: user.branchId
            }, JWT_SECRET, { expiresIn: '8h' });

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

        if (!user) {
            console.warn(`[AUTH] Refresh token reuse detected or invalid for user ID: ${payload.id}`);
            return res.status(403).json({ error: "Refresh Token inválido o revocado" });
        }

        // Issue new Access Token
        const newToken = jwt.sign({
            id: user.id,
            role: user.role,
            tenantId: payload.tenantId,
            branchId: user.branchId
        }, JWT_SECRET, { expiresIn: '8h' }); // Standard session

        // Issue new Refresh Token (Rotation)
        const newRefreshToken = jwt.sign({
            id: user.id,
            role: user.role,
            tenantId: payload.tenantId
        }, JWT_SECRET, { expiresIn: '7d' });

        // Update DB with the new refresh token (invalidating the old one)
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken }
        });

        res.json({ success: true, token: newToken, refreshToken: newRefreshToken });

    } catch (e) {
        console.error('[AUTH] Refresh Error:', e.message);
        return res.status(403).json({ error: "Token inválido o expirado" });
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
                organizationId: targetTenant
            }
        });

        // Invalidate Cache
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`services:${targetTenant} `);
        }

        res.json({ success: true, service: newService });
    } catch (e) {
        console.error("Error creating service:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/services/export', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            where: { organizationId: req.tenantId },
            orderBy: { name: 'asc' }
        });
        res.json(services);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/services/import', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { services } = req.body;
        if (!Array.isArray(services)) return res.status(400).json({ success: false, error: "Datos inválidos" });

        const created = [];
        for (const s of services) {
            const newS = await prisma.service.create({
                data: {
                    name: s.name,
                    duration: parseInt(s.duration || 30),
                    price: parseFloat(s.price || 0),
                    category: s.category || 'General',
                    status: s.status || 'ACTIVE',
                    description: s.description || '',
                    imageUrl: s.imageUrl || '',
                    organizationId: req.tenantId
                }
            });
            created.push(newS);
        }

        if (redisClient && redisClient.isOpen) await redisClient.del(`services:${req.tenantId}`);
        res.json({ success: true, count: created.length });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- PRODUCTS IMPORT/EXPORT ---
app.get('/api/products/export', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { organizationId: req.tenantId },
            orderBy: { name: 'asc' }
        });
        res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products/import', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products)) return res.status(400).json({ success: false, error: "Datos inválidos" });

        const created = [];
        for (const p of products) {
            const newP = await prisma.product.create({
                data: {
                    name: p.name,
                    sku: p.sku || `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    price: parseFloat(p.price || 0),
                    cost: parseFloat(p.cost || 0),
                    stock: parseInt(p.stock || 0),
                    minStock: parseInt(p.minStock || 5),
                    category: p.category || 'General',
                    usage: p.usage || 'RETAIL',
                    description: p.description || '',
                    organizationId: req.tenantId,
                    branchId: req.branchId || null
                }
            });
            created.push(newP);
        }

        const branchKey = req.branchId || 'global';
        if (redisClient && redisClient.isOpen) await redisClient.del(`products:${req.tenantId}:${branchKey}`);
        res.json({ success: true, count: created.length });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
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
            await redisClient.del(`services:${req.tenantId}`);
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CLIENTS ENDPOINTS ---

app.get('/api/clients', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const clients = await prisma.user.findMany({
            where: {
                organizationId: req.tenantId,
                role: 'CLIENT'
            },
            orderBy: { name: 'asc' }
        });

        // Map User to Client interface
        const mappedClients = clients.map(u => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            skinType: u.skinType,
            allergies: u.allergies,
            medicalConditions: u.medicalConditions,
            notes: u.preferences?.notes || '',
            birthDate: u.preferences?.birthDate || null,
            consentAccepted: u.preferences?.consentAccepted || false,
            treatmentHistory: [] // TODO: Fetch from appointments
        }));

        res.json(mappedClients);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, phone, email, skinType, allergies, medicalConditions, notes, birthDate } = req.body;

        const newClient = await prisma.user.create({
            data: {
                name,
                phone,
                email,
                role: 'CLIENT',
                organizationId: req.tenantId,
                skinType,
                allergies,
                medicalConditions,
                preferences: {
                    notes,
                    birthDate,
                    consentAccepted: false // Default
                }
            }
        });

        res.json({ success: true, client: newClient });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, skinType, allergies, medicalConditions, notes, birthDate, consentAccepted } = req.body;

        // Fetch existing to merge preferences
        const existing = await prisma.user.findUnique({ where: { id } });

        const updatedClient = await prisma.user.update({
            where: { id },
            data: {
                name,
                phone,
                email,
                skinType,
                allergies,
                medicalConditions,
                preferences: {
                    ...(existing?.preferences || {}),
                    notes,
                    birthDate,
                    consentAccepted
                }
            }
        });

        res.json({ success: true, client: updatedClient });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LEADS ENDPOINTS ---

app.get('/api/leads', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({
            where: { organizationId: req.tenantId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leads', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, phone, email, source, notes, estimatedValue, interestLevel, preferredContact } = req.body;
        const newLead = await prisma.lead.create({
            data: {
                name, phone, email,
                source: source || 'MANUAL',
                status: 'NEW',
                notes,
                estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
                interestLevel: interestLevel || 'MEDIUM',
                preferredContact: preferredContact || 'WHATSAPP',
                organizationId: req.tenantId
            }
        });
        res.json({ success: true, lead: newLead });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// WEBHOOK for n8n/Facebook/WhatsApp
app.post('/api/leads/webhook', async (req, res) => {
    try {
        const { name, phone, email, source, tenantId, notes } = req.body;

        const tenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { id: tenantId },
                    { subdomain: tenantId }
                ]
            }
        });

        if (!tenant) return res.status(404).json({ error: "Tenant host no detectado" });

        const newLead = await prisma.lead.create({
            data: {
                name,
                phone,
                email,
                source: source || 'EXTERNAL_API',
                status: 'NEW',
                notes: notes || 'Lead capturado vía webhook',
                organizationId: tenant.organizationId
            }
        });

        res.json({ success: true, leadId: newLead.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/leads/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, name, phone, email, estimatedValue, interestLevel, preferredContact } = req.body;
        const updated = await prisma.lead.update({
            where: { id },
            data: {
                status, notes, name, phone, email,
                estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
                interestLevel,
                preferredContact,
                updatedAt: new Date()
            }
        });
        res.json({ success: true, lead: updated });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leads/:id/convert', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) return res.status(404).json({ error: "Lead no encontrado" });

        const newClient = await prisma.user.create({
            data: {
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                role: 'CLIENT',
                organizationId: req.tenantId,
                preferences: { notes: lead.notes, convertedFrom: 'LEAD', leadId: lead.id }
            }
        });

        await prisma.lead.update({
            where: { id },
            data: { status: 'CONVERTED' }
        });

        res.json({ success: true, client: newClient });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/leads/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        await prisma.lead.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/professionals', tenantMiddleware, async (req, res) => {
    try {
        const professionals = await prisma.professional.findMany({
            where: { organizationId: req.tenantId || 'demo' },
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                aurumEmployeeId: true,
                weeklySchedule: true,
                exceptions: true,
                tenantId: true,
                branchId: true,
                serviceIds: true
            }
        });
        res.json(professionals);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/professionals', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, role, email, aurumEmployeeId, weeklySchedule, exceptions } = req.body;
        const pro = await prisma.professional.create({
            data: {
                name,
                role,
                email,
                aurumEmployeeId: aurumEmployeeId,
                weeklySchedule: weeklySchedule || [],
                exceptions: exceptions || [],
                organizationId: req.tenantId || 'demo',
                tenantId: req.tenantId,
                serviceIds: ''
            }
        });
        res.json({ success: true, id: pro.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


app.put('/api/professionals/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { name, role, email, aurumEmployeeId, weeklySchedule, exceptions } = req.body;
        await prisma.professional.update({
            where: { id: req.params.id },
            data: {
                name,
                role,
                email,
                aurumEmployeeId,
                weeklySchedule,
                exceptions
            }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/professionals/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        await prisma.professional.delete({ where: { id: req.params.id } });
        res.json({ success: true });
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

app.get('/api/settings/landing', tenantMiddleware, async (req, res) => {
    try {
        const organizationId = req.tenantId || 'demo';
        let data = await prisma.landingSetting.findUnique({
            where: { organizationId }
        });

        // Initialize default with Rich Data (Shula Studio Template)
        if (!data) {
            console.log(`[LANDING] Creating default settings for org: ${organizationId}`);
            try {
                // If it's shula, we want specifically the shula branding
                const isShula = organizationId === 'shula' || organizationId === 'master';

                data = await prisma.landingSetting.create({
                    data: {
                        organizationId,
                        businessName: isShula ? 'Shula Studio Global' : organizationId.toUpperCase(),
                        primaryColor: '#D4AF37', // Gold
                        secondaryColor: '#000000', // Black
                        templateId: 'shula_dark',
                        slogan: isShula ? 'Elegancia en cada detalle de tu mirada' : 'Gestión Inteligente de Citas',
                        aboutText: isShula ? 'En Shula Studio, transformamos la belleza en una experiencia de lujo. Expertos en extensiones de pestañas y diseño de cejas.' : 'Plataforma líder en gestión de servicios y citas.',
                        address: 'Ciudad de México',
                        contactPhone: '+52 55 1234 5678',
                        whatsappPhone: '525512345678',
                        heroImageUrl: isShula ? 'https://images.unsplash.com/photo-1522335718011-7f3bc8fba899' : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop',
                        logoUrl: '',
                        seoTitle: isShula ? 'Shula Studio - Pestañas & Cejas' : `${organizationId.toUpperCase()} - Reservas`,
                        images: [
                            { url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=2070&auto=format&fit=crop', caption: 'Resultados Naturales' },
                            { url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop', caption: 'Estudio Premium' },
                            { url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1935&auto=format&fit=crop', caption: 'Atención Personalizada' }
                        ],
                        services: [
                            { title: 'Extensiones de Pestañas', description: 'Técnica clásica uno a uno.', price: '$550' },
                            { title: 'Diseño de Cejas', description: 'Depilación y sombreado premium.', price: '$350' }
                        ],
                        features: { ai: true, inventory: true, marketing: true }
                    }
                });
            } catch (createErr) {
                console.warn(`[LANDING] Failed to persist default settings for ${organizationId}, returning in-memory fallback.`, createErr.message);
                // Return a valid object so the frontend works even if DB fails to create the default record
                data = {
                    organizationId,
                    businessName: organizationId === 'shula' ? 'Shula Studio Global' : organizationId.toUpperCase(),
                    primaryColor: '#D4AF37',
                    secondaryColor: '#000000',
                    templateId: 'shula_dark',
                    images: [
                        { url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=2070&auto=format&fit=crop', caption: 'Resultados Naturales' },
                        { url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop', caption: 'Estudio Premium' },
                        { url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1935&auto=format&fit=crop', caption: 'Atención Personalizada' }
                    ]
                };
            }
        }

        // Fetch complementary info from Tenant table
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: organizationId }
        });

        const normalized = {
            businessName: organizationId === 'demo' ? BRAND_NAME : (data?.businessName?.trim() || organizationId.toUpperCase() || BRAND_NAME),
            primaryColor: data.primaryColor || '#630E14',
            secondaryColor: data.secondaryColor || '#C5A028',
            templateId: data.templateId || 'citaplanner',
            slogan: data.slogan || 'Gestión de Lujo Simplificada',
            aboutText: data.aboutText || 'Plataforma líder en gestión de citas.',
            address: data.address || 'Ubicación Central',
            contactPhone: data.contactPhone || '+52 55 0000 0000',
            heroImageUrl: data.heroImageUrl || '',
            logoUrl: data.logoUrl || '',
            seoTitle: data.seoTitle || '',
            seoDescription: data.seoDescription || '',
            seoKeywords: data.seoKeywords || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            maintenanceMode: !!data.maintenanceMode,
            whatsappPhone: data.whatsappPhone || '',
            footerText: data.footerText || '',
            socialInstagram: data.socialInstagram || '',
            socialFacebook: data.socialFacebook || '',
            socialTwitter: data.socialTwitter || '',
            images: data.images || [],
            services: data.services || [],
            heroSlides: data.heroSlides || [],
            stats: data.stats || [],
            testimonials: data.testimonials || [],
            serviceIds: data.serviceIds || [],
            productIds: data.productIds || [],
            subdomain: organizationId,
            bridge: tenant ? {
                enabled: tenant.bridgeEnabled || false,
                webhookUrl: tenant.bridgeWebhookUrl || '',
                apiKey: tenant.bridgeApiKey || '',
                satelliteId: tenant.bridgeSatelliteId || 3
            } : {
                enabled: false,
                webhookUrl: '',
                apiKey: '',
                satelliteId: 3
            }
        };
        res.json({ success: true, value: normalized });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings/landing', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const organizationId = req.tenantId;
        const s = req.body;
        const safeStr = (val, max) => val ? String(val).substring(0, max) : null;

        const existing = await prisma.landingSetting.findUnique({ where: { organizationId } });

        const data = {
            businessName: s.businessName !== undefined ? safeStr(s.businessName, 100) : existing?.businessName,
            primaryColor: s.primaryColor !== undefined ? safeStr(s.primaryColor, 20) : existing?.primaryColor,
            secondaryColor: s.secondaryColor !== undefined ? safeStr(s.secondaryColor, 20) : existing?.secondaryColor,
            templateId: s.templateId !== undefined ? safeStr(s.templateId, 20) : existing?.templateId,
            logoUrl: s.logoUrl !== undefined ? s.logoUrl : existing?.logoUrl,
            slogan: s.slogan !== undefined ? s.slogan : existing?.slogan,
            aboutText: s.aboutText !== undefined ? s.aboutText : existing?.aboutText,
            address: s.address !== undefined ? s.address : existing?.address,
            contactPhone: s.contactPhone !== undefined ? safeStr(s.contactPhone, 20) : existing?.contactPhone,
            heroImageUrl: s.heroImageUrl !== undefined ? s.heroImageUrl : existing?.heroImageUrl,
            seoTitle: s.seoTitle !== undefined ? safeStr(s.seoTitle, 100) : existing?.seoTitle,
            seoDescription: s.seoDescription !== undefined ? s.seoDescription : existing?.seoDescription,
            seoKeywords: s.seoKeywords !== undefined ? s.seoKeywords : existing?.seoKeywords,
            latitude: s.latitude !== undefined ? parseFloat(s.latitude) : existing?.latitude,
            longitude: s.longitude !== undefined ? parseFloat(s.longitude) : existing?.longitude,
            maintenanceMode: s.maintenanceMode !== undefined ? !!s.maintenanceMode : existing?.maintenanceMode,
            whatsappPhone: s.whatsappPhone !== undefined ? safeStr(s.whatsappPhone, 20) : existing?.whatsappPhone,
            footerText: s.footerText !== undefined ? s.footerText : existing?.footerText,
            socialInstagram: s.socialInstagram !== undefined ? safeStr(s.socialInstagram, 255) : existing?.socialInstagram,
            socialFacebook: s.socialFacebook !== undefined ? safeStr(s.socialFacebook, 255) : existing?.socialFacebook,
            socialTwitter: s.socialTwitter !== undefined ? safeStr(s.socialTwitter, 255) : existing?.socialTwitter,
            images: Array.isArray(s.images) ? s.images : existing?.images || [],
            services: Array.isArray(s.services) ? s.services : existing?.services || [],
            heroSlides: Array.isArray(s.heroSlides) ? s.heroSlides : existing?.heroSlides || [],
            stats: Array.isArray(s.stats) ? s.stats : existing?.stats || [],
            testimonials: Array.isArray(s.testimonials) ? s.testimonials : existing?.testimonials || [],
            serviceIds: Array.isArray(s.serviceIds) ? s.serviceIds : existing?.serviceIds || [],
            productIds: Array.isArray(s.productIds) ? s.productIds : existing?.productIds || []
        };

        const updated = await prisma.landingSetting.upsert({
            where: { organizationId },
            update: data,
            create: { organizationId, ...data }
        });

        res.json({ success: true, settings: updated });
    } catch (e) {
        console.error('[LANDING PUT ERROR]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- BRIDGE SETTINGS & INTERCONNECTIVITY ---
app.put('/api/settings/bridge', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { enabled, webhookUrl, satelliteId } = req.body;
        const subdomain = req.tenantId;

        await prisma.tenant.update({
            where: { subdomain },
            data: {
                bridgeEnabled: enabled,
                bridgeWebhookUrl: webhookUrl,
                bridgeSatelliteId: parseInt(satelliteId) || 3
            }
        });

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/bridge/rotate-key', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const subdomain = req.tenantId;
        const newKey = crypto.randomUUID();

        await prisma.tenant.update({
            where: { subdomain },
            data: { bridgeApiKey: newKey }
        });

        res.json({ success: true, key: newKey });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/bridge/test', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: req.tenantId }
        });

        if (!tenant || !tenant.bridgeWebhookUrl) {
            return res.status(400).json({ success: false, message: "Webhook no configurado" });
        }

        console.log(`[BRIDGE] Testing handshake for: ${req.tenantId} -> ${tenant.bridgeWebhookUrl}`);

        const response = await axios.post(tenant.bridgeWebhookUrl, {
            type: 'HANDSHAKE',
            satelliteId: tenant.bridgeSatelliteId,
            timestamp: new Date().toISOString()
        }, {
            headers: { 'X-Aurum-Key': tenant.bridgeApiKey },
            timeout: 5000
        }).catch(e => ({ status: 500, data: { message: e.message } }));

        if (response.status === 200) {
            res.json({ success: true, message: "Handshake Exitoso con Aurum Holding" });
        } else {
            res.json({ success: false, message: "Holding Offline o Error de Configuración" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});


app.post('/api/ai/visual-improve', authenticateToken, async (req, res) => {
    try {
        const { title, category } = req.body;
        if (!title) return res.status(400).json({ error: "Título requerido" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const promptForPrompt = `Genera un prompt de generación de imagen ULTRA-PROFESIONAL en INGLÉS para un servicio de belleza llamado "${title}".
        El estilo debe ser: Fotografía editorial de alta gama, iluminación cinematográfica, primer plano, estilo minimalista y lujoso, 8k, ultra-realista.
        Responde ÚNICAMENTE con el prompt en inglés, sin explicaciones.`;

        const result = await model.generateContent(promptForPrompt);
        const aiPrompt = result.response.text().trim();

        // NanoBanana Engine (Simulado con Pollinations.ai para demostración inmediata y funcional)
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1080&height=1350&nologo=true&seed=${seed}`;

        res.json({ 
            success: true, 
            imageUrl,
            prompt: aiPrompt 
        });
    } catch (e) {
        console.error("NanoBanana Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/service-suggestion', authenticateToken, async (req, res) => {
    try {
        const { title, category } = req.body;
        if (!title) return res.status(400).json({ error: "Título requerido" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `Actúa como un experto Copywriter de lujo para estudios de belleza de clase mundial (tipo Shula Studio). 
        Genera una descripción seductora y profesional para un servicio llamado "${title}" en la categoría "${category || 'General'}".
        También genera instrucciones de cuidado post-cita (aftercare) breves y claras que la IA enviará al cliente.

        Responde ÚNICAMENTE con un objeto JSON válido con este formato:
        {
          "description": "Una narrativa de 3-4 líneas que resalte los beneficios, el lujo y la técnica.",
          "careInstructions": "3-4 puntos clave de cuidado post-servicio."
        }`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Sanitize JSON response (Gemini sometimes adds ```json blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            res.json({ success: true, data });
        } else {
            res.status(500).json({ error: "No se pudo generar el formato JSON" });
        }
    } catch (e) {
        console.error("AI Suggestion Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/concierge', async (req, res) => {
    try {
        const { message, context } = req.body;
        const tenantId = req.tenantId || context?.tenantId;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            tools: [
                {
                    functionDeclarations: [
                        {
                            name: "get_services",
                            description: "Obtiene la lista de servicios disponibles, precios y descripciones.",
                            parameters: { type: "OBJECT", properties: {}, required: [] }
                        },
                        {
                            name: "check_availability",
                            description: "Consulta los horarios disponibles para una fecha específica.",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    date: { type: "STRING", description: "Fecha en formato YYYY-MM-DD" }
                                },
                                required: ["date"]
                            }
                        }
                    ]
                }
            ]
        });

        const chat = model.startChat({
            history: context?.history || [],
            generationConfig: { maxOutputTokens: 1000 }
        });

        // Set system instruction via context if needed or hardcoded
        const systemPrompt = `Eres el Concierge Inteligente de Aurum. Ayudas al cliente con:
        1. Consultar servicios y precios.
        2. Ver disponibilidad de citas.
        3. Instrucciones de cuidado post-cita.
        Solo agenda citas de forma tentativa. Siempre sé amable y sofisticado.
        ID del Tenant actual: ${tenantId}`;

        const result = await chat.sendMessageStream(`${systemPrompt}\n\nCliente: ${message}`);

        // Handle potential function calls (simplified for first pass)
        let fullText = "";
        for await (const chunk of result.stream) {
            const part = chunk.candidates[0].content.parts[0];
            if (part.functionCall) {
                const call = part.functionCall;
                let functionResponse = {};

                if (call.name === "get_services") {
                    const services = await prisma.service.findMany({ where: { organizationId: tenantId, status: 'ACTIVE' } });
                    functionResponse = { services: services.map(s => ({ name: s.name, price: s.price, duration: s.duration, description: s.description, careInstructions: s.careInstructions })) };
                } else if (call.name === "check_availability") {
                    const { date } = call.args;
                    // Mock availability check based on existing appointments
                    const apps = await prisma.appointment.findMany({
                        where: {
                            organizationId: tenantId,
                            startDateTime: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000) }
                        }
                    });
                    functionResponse = {
                        unavailable_slots: apps.map(a => a.startDateTime.toISOString()),
                        info: "Considera que abrimos de 9am a 8pm."
                    };
                }

                const result2 = await chat.sendMessage([{
                    functionResponse: {
                        name: call.name,
                        response: functionResponse
                    }
                }]);
                fullText = result2.response.text();
                break;
            } else {
                fullText += chunk.text();
            }
        }

        res.json({ text: fullText });
    } catch (e) {
        console.error("AI Concierge Error:", e);
        res.status(500).json({ error: "El nodo cerebral está recalibrando. Intenta en un momento." });
    }
});

// --- MAINTENANCE MANAGEMENT SYSTEM API ---

// 1. Get/Set Master Plan (Maintenance Tasks)
app.get('/api/maintenance/tasks', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const tasks = await prisma.maintenanceTask.findMany({
            where: { tenantId: req.tenantId },
            orderBy: [{ dayOfWeek: 'asc' }, { priority: 'asc' }]
        });
        res.json(tasks);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/maintenance/tasks', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { dayOfWeek, taskName, priority } = req.body;
        const task = await prisma.maintenanceTask.create({
            data: {
                dayOfWeek: parseInt(dayOfWeek),
                taskName,
                priority: parseInt(priority) || 1,
                tenantId: req.tenantId
            }
        });
        res.json(task);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/maintenance/tasks/:id', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        await prisma.maintenanceTask.delete({
            where: { id: req.params.id, tenantId: req.tenantId }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Daily Assignments
app.get('/api/maintenance/assignments', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        const assignments = await prisma.taskAssignment.findMany({
            where: {
                tenantId: req.tenantId,
                date: date ? new Date(date) : undefined
            },
            include: { task: true, professional: true },
            orderBy: { task: { priority: 'asc' } }
        });
        res.json(assignments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Mark Task as Complete (Professional)
app.post('/api/maintenance/assignments/:id/complete', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const assignment = await prisma.taskAssignment.update({
            where: { id: req.params.id, tenantId: req.tenantId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            },
            include: { task: true, tenant: true }
        });

        // Notify Admin via WhatsApp
        const adminPhone = assignment.tenant?.verificationRecord?.adminPhone || '52155...'; // Use tenant config
        const message = `✅ Tarea Completada: "${assignment.task.taskName}" ha sido finalizada por ${req.user.name} a las ${new Date().toLocaleTimeString('es-MX')}.`;
        await sendWhatsAppMessage(adminPhone, message, null, req.tenantId);

        res.json(assignment);
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


app.get('/api/business-stats', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const organizationId = req.tenantId;
        const tenantUuid = req.tenantUuid;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Core KPIs
        const [totalRevenue, completedAppointments, newClients, totalAppointments] = await Promise.all([
            prisma.sale.aggregate({
                where: { tenantId: tenantUuid },
                _sum: { total: true }
            }),
            prisma.appointment.count({
                where: { organizationId, status: 'COMPLETED' }
            }),
            prisma.user.count({
                where: { organizationId, role: 'CLIENT', createdAt: { gte: firstDayOfMonth } }
            }),
            prisma.appointment.count({
                where: { organizationId }
            })
        ]);

        // 2. Revenue Flow (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const salesLast7Days = await prisma.sale.findMany({
            where: { tenantId: tenantUuid, createdAt: { gte: sevenDaysAgo } },
            select: { total: true, createdAt: true }
        });

        const dailyRevenue = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dailyRevenue[d.toISOString().split('T')[0]] = 0;
        }
        salesLast7Days.forEach(s => {
            const day = s.createdAt.toISOString().split('T')[0];
            if (dailyRevenue[day] !== undefined) dailyRevenue[day] += parseFloat(s.total || 0);
        });

        const revenueFlow = Object.entries(dailyRevenue)
            .map(([day, total]) => ({ day, total }))
            .sort((a, b) => a.day.localeCompare(b.day));

        // 3. Service Distribution
        const appointmentsWithServices = await prisma.appointment.findMany({
            where: { organizationId, status: 'COMPLETED' },
            select: { serviceId: true }
        });
        
        const serviceCounts = {};
        appointmentsWithServices.forEach(a => {
            if (a.serviceId) serviceCounts[a.serviceId] = (serviceCounts[a.serviceId] || 0) + 1;
        });

        const services = await prisma.service.findMany({
            where: { id: { in: Object.keys(serviceCounts) } },
            select: { id: true, name: true }
        });

        const serviceMix = services.map(s => ({
            name: s.name,
            value: serviceCounts[s.id]
        }));

        // 4. Top Products
        const sales = await prisma.sale.findMany({
            where: { tenantId: tenantUuid },
            select: { items: true }
        });

        const productSales = {};
        sales.forEach(sale => {
            const items = Array.isArray(sale.items) ? sale.items : [];
            items.forEach(item => {
                if (item.id && item.type === 'product') {
                    productSales[item.name] = (productSales[item.name] || 0) + (item.quantity || 1);
                }
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        res.json({
            kpis: [
                { label: 'Ingresos Totales', value: `$${parseFloat(totalRevenue._sum.total || 0).toLocaleString()}`, change: '+12.5%', trend: 'up' },
                { label: 'Citas Completadas', value: completedAppointments.toString(), change: '+5.2%', trend: 'up' },
                { label: 'Nuevos Clientes', value: newClients.toString(), change: '+18.3%', trend: 'up' },
                { label: 'Ocupación', value: totalAppointments > 0 ? `${Math.round((completedAppointments / totalAppointments) * 100)}%` : '0%', change: '-2.1%', trend: 'down' }
            ],
            revenueFlow,
            serviceMix,
            topProducts
        });
    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/sales', authenticateToken, tenantMiddleware, async (req, res) => {
    try {
        const { items, total, paymentMethod, clientName } = req.body;
        const sale = await prisma.sale.create({
            data: {
                items,
                total: parseFloat(total),
                paymentMethod,
                clientName,
                tenantId: req.tenantUuid
            }
        });
        res.json({ success: true, saleId: sale.id, date: sale.createdAt });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API no encontrado' });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- AI AUTOMATIONS (WORKERS) ---

// 1. Appointment Reminders (24h before)
cron.schedule('0 * * * *', async () => {
    console.log("🕒 Running AI Reminder Worker...");
    try {
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);

        const apps = await prisma.appointment.findMany({
            where: {
                status: 'SCHEDULED',
                reminderSent: false,
                startDateTime: {
                    gte: new Date(),
                    lte: tomorrow
                }
            },
            include: { tenant: true }
        });

        for (const app of apps) {
            // Only if AI Automation is enabled for this tenant
            if (app.tenant?.features?.ai_automation) {
                const dateStr = app.startDateTime.toLocaleString('es-MX', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
                const message = `🌟 Recordatorio Aurum: Hola ${app.clientName}, te esperamos mañana ${dateStr} para tu cita de "${app.title}". ¿Deseas confirmar tu asistencia?`;
                await sendWhatsAppMessage(app.clientPhone, message, app.branchId, app.organizationId);

                await prisma.appointment.update({
                    where: { id: app.id },
                    data: { reminderSent: true }
                });
            }
        }
    } catch (e) { console.error("❌ Reminder Worker Error:", e); }
});

// 2. Post-Appointment Care Instructions (3h after completion)
cron.schedule('30 * * * *', async () => {
    console.log("🕒 Running AI Care Instruction Worker...");
    try {
        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

        const apps = await prisma.appointment.findMany({
            where: {
                status: 'COMPLETED',
                careSent: false,
                updatedAt: { lte: threeHoursAgo }
            },
            include: { service: true, tenant: true }
        });

        for (const app of apps) {
            if (app.tenant?.features?.ai_automation && app.service?.careInstructions) {
                const message = `🌸 En Aurum nos importa tu belleza: Para prolongar los resultados de tu "${app.service.name}", te recomendamos:\n\n${app.service.careInstructions}\n\n¡Esperamos verte pronto!`;
                await sendWhatsAppMessage(app.clientPhone, message, app.branchId, app.organizationId);

                await prisma.appointment.update({
                    where: { id: app.id },
                    data: { careSent: true }
                });
            }
        }
    } catch (e) { console.error("❌ Care Worker Error:", e); }
});

// 3. Birthday Greetings (6 AM Daily)
cron.schedule('0 6 * * *', async () => {
    console.log("🕒 Running AI Birthday Worker...");
    try {
        const today = new Date();
        const monthDay = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

        const clients = await prisma.user.findMany({
            where: {
                role: 'CLIENT',
                preferences: { path: ['birthDate'], string_contains: monthDay }
            }
        });

        for (const client of clients) {
            const tenant = await prisma.tenant.findUnique({ where: { subdomain: client.organizationId } });
            if (tenant?.features?.ai_automation) {
                const message = `🎂 ¡Feliz Cumpleaños ${client.name}! En ${tenant.name} celebramos tu día. Visítanos este mes y recibe un 15% de regalo en tu próximo servicio. ✨`;
                await sendWhatsAppMessage(client.phone, message, null, client.organizationId);
            }
        }
    } catch (e) { console.error("❌ Birthday Worker Error:", e); }
});


// 4. Maintenance Task Distributor (6 AM Daily)
cron.schedule('0 6 * * *', async () => {
    console.log("🕒 Running AI Maintenance Distributor...");
    try {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0-6
        const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });

        for (const tenant of tenants) {
            // Only if AI Automation is enabled
            if (!tenant.features?.ai_automation) continue;

            const tasks = await prisma.maintenanceTask.findMany({
                where: { tenantId: tenant.id, dayOfWeek },
                orderBy: { priority: 'asc' }
            });

            if (tasks.length === 0) continue;

            const professionals = await prisma.professional.findMany({
                where: { tenantId: tenant.id }
            });

            // Filter professionals working today based on weekly_schedule
            const activeStaff = professionals.filter(p => {
                const schedule = p.weeklySchedule; // e.g., [{day: "Lunes", label: "09:00 - 18:00"}]
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
                return schedule?.some(s => s.day === dayNames[dayOfWeek]);
            });

            if (activeStaff.length === 0) continue;

            // Equitable Distribution (Round-Robin)
            const assignments = [];
            for (let i = 0; i < tasks.length; i++) {
                const staff = activeStaff[i % activeStaff.length];
                assignments.push({
                    date: today,
                    taskId: tasks[i].id,
                    assignedTo: staff.id,
                    tenantId: tenant.id
                });
            }

            // Save Assignments
            await prisma.taskAssignment.createMany({ data: assignments });

            // Notify each active staff member via WhatsApp
            for (const staff of activeStaff) {
                const staffTasks = assignments.filter(a => a.assignedTo === staff.id);
                const taskList = staffTasks.map((a, idx) => {
                    const t = tasks.find(t => t.id === a.taskId);
                    return `${idx + 1}. ${t.taskName}`;
                }).join('\n');

                const message = `🧹 ¡Buen día ${staff.name}! Hoy en ${tenant.name} tus tareas de mantenimiento asignadas son:\n\n${taskList}\n\nPor favor, marca como "Completada" cada una en tu dashboard al finalizar. ¡Buen turno! ✨`;

                // Assuming phone is stored in professional's email or we need to find the user
                const user = await prisma.user.findFirst({ where: { relatedId: staff.id } });
                if (user?.phone) {
                    await sendWhatsAppMessage(user.phone, message, staff.branchId, tenant.organizationId);
                }
            }
        }
    } catch (e) { console.error("❌ Maintenance Worker Error:", e); }
});


// INITIALIZE INFRASTRUCTURE

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    ensureSchemaIntegrity().then(() => {
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://${ROOT_DOMAIN}:${PORT}`);
            console.log(`📡 WebSockets enabled on same port`);
        });
    });
}

export { app };
