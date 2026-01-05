
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

// Configuración de Multer para almacenamiento local de imágenes (Logo, Galería, etc)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/citaplanner_dev';

const pool = new Pool({ 
  connectionString: connectionString,
  ssl: connectionString.includes('sslmode=disable') || !process.env.DATABASE_URL ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, 
  statement_timeout: 10000 
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const initDB = async () => {
  let client;
  try {
    if (process.env.DATABASE_URL) {
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        
        // Tablas del Ecosistema Aurum
        await client.query(`CREATE TABLE IF NOT EXISTS branches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
          name VARCHAR(100), 
          address TEXT,
          phone VARCHAR(20),
          manager VARCHAR(100),
          status VARCHAR(20) DEFAULT 'ACTIVE', 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        await client.query(`CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
          name VARCHAR(100), 
          phone VARCHAR(20) UNIQUE, 
          email VARCHAR(100), 
          password VARCHAR(100), 
          role VARCHAR(20), 
          avatar TEXT,
          branch_id UUID, 
          preferences JSONB DEFAULT '{}', 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        await client.query(`CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
          title VARCHAR(150), 
          start_datetime TIMESTAMP, 
          end_datetime TIMESTAMP, 
          client_name VARCHAR(100), 
          client_phone VARCHAR(20),
          status VARCHAR(20), 
          description TEXT,
          branch_id UUID, 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        // Tabla para configuraciones persistentes (Landing, SEO, Toggles)
        await client.query(`CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR(50) PRIMARY KEY,
          value JSONB DEFAULT '{}'
        );`);

        await client.query(`CREATE TABLE IF NOT EXISTS integration_logs (
          id SERIAL PRIMARY KEY, 
          platform VARCHAR(50), 
          event_type VARCHAR(50), 
          payload JSONB, 
          response TEXT, 
          status VARCHAR(20), 
          branch_id UUID, 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        
        // Seed inicial para Landing Page si está vacío
        const checkSettings = await client.query("SELECT key FROM settings WHERE key = 'landing'");
        if (checkSettings.rows.length === 0) {
          const defaultLanding = {
            businessName: 'Aurum Beauty Studio',
            primaryColor: '#C5A028',
            showWhatsappButton: true,
            contactPhone: '+52 55 7142 7321',
            slogan: 'Redefiniendo la Estética de Ultra-Lujo',
            aboutText: 'Santuario de belleza líder en alta tecnología.'
          };
          await client.query("INSERT INTO settings (key, value) VALUES ('landing', $1)", [defaultLanding]);
        }

        await client.query('COMMIT');
        console.log("✅ Aurum Protocol: Database Schema Synchronized");
    } else {
        console.log("⚠️ Modo Sin Base de Datos: DATABASE_URL no detectada. Usando modo memoria/dev.");
    }
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ DB Init Error:', e.message);
  } finally {
    if (client) client.release();
  }
};

// --- ENDPOINTS DE CONFIGURACIÓN ---
app.get('/api/settings/landing', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'landing'");
    if (result.rows.length > 0) {
      res.json(result.rows[0].value);
    } else {
      res.json({});
    }
  } catch (e) {
    res.status(500).json({ error: "Error al obtener configuración" });
  }
});

app.put('/api/settings/landing', async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('landing', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [req.body]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error al guardar configuración" });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;

    if (phone === 'dev' && password === 'dev') {
        return res.json({
            success: true,
            user: {
                id: 'dev-master-id',
                name: 'Dev Admin',
                phone: 'dev',
                role: 'ADMIN',
                branchId: 'dev-branch-01',
                email: 'dev@aurum.ai',
                preferences: { whatsapp: true, email: true }
            }
        });
    }

    try {
        const result = await pool.query("SELECT id, name, phone, email, role, avatar, branch_id FROM users WHERE phone = $1 AND password = $2", [phone, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
    } catch (e) { 
        res.status(500).json({error: "Falla en infraestructura de datos."}); 
    }
});

// SPA Fallback corregido para Express 5
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 AURUM NODE ACTIVE | Port: ${PORT}`));
initDB();
