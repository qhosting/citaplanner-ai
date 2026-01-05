
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

// Configuración de Multer para almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString: connectionString,
  ssl: connectionString?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
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
        
        await client.query(`CREATE TABLE IF NOT EXISTS branches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
          name VARCHAR(100), 
          status VARCHAR(20) DEFAULT 'ACTIVE', 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        await client.query(`CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
          name VARCHAR(100), 
          phone VARCHAR(20) UNIQUE, 
          email VARCHAR(100), 
          password VARCHAR(100), 
          avatar TEXT,
          role VARCHAR(20), 
          branch_id UUID, 
          preferences JSONB DEFAULT '{}', 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        await client.query('COMMIT');
        console.log("✅ Aurum Protocol: Database Schema Synchronized");
    }
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ DB Init Error:', e.message);
  } finally {
    if (client) client.release();
  }
};

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const result = await pool.query("SELECT id, name, phone, email, role, avatar, branch_id FROM users WHERE phone = $1 AND password = $2", [phone, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: "Credenciales inválidas" });
        }
    } catch (e) { 
        res.status(500).json({ error: "Falla en infraestructura de datos" }); 
    }
});

// En Express 5.x (usando path-to-regexp v6+), los grupos de captura y comodines deben ser nombrados.
// Usamos '/:path*' para capturar todas las rutas y servir el index.html (SPA fallback).
app.get('/:path*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 AURUM NODE ACTIVE | Port: ${PORT}`));
initDB();
