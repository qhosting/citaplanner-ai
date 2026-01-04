
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Required for WAHA integration

// 520 - Financial Flow: Environment Configuration
const app = express();
const PORT = process.env.PORT || 3000;
const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000'; // Default internal docker network

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// 148721091 - Materialization: Database Migration & Schema Evolution
const initDB = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

      // 1. Branches Table (Multi-tenancy foundation)
      await client.query(`
        CREATE TABLE IF NOT EXISTS branches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          address TEXT,
          phone VARCHAR(20),
          manager VARCHAR(100),
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Ensure Default Branch Exists
      const branchRes = await client.query("SELECT id FROM branches LIMIT 1");
      let defaultBranchId;
      
      if (branchRes.rowCount === 0) {
        const newBranch = await client.query(`
          INSERT INTO branches (name, address, status) 
          VALUES ('Sede Central Aurum', 'Av. Principal 123', 'ACTIVE') 
          RETURNING id;
        `);
        defaultBranchId = newBranch.rows[0].id;
        console.log(`✨ Default Branch Created: ${defaultBranchId}`);
      } else {
        defaultBranchId = branchRes.rows[0].id;
      }

      // 3. Schema Evolution: Add branch_id to existing tables safely
      const tablesToCheck = ['users', 'appointments', 'products', 'services', 'transactions'];
      
      for (const table of tablesToCheck) {
        // Check if column exists
        const colCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='${table}' AND column_name='branch_id';
        `);
        
        if (colCheck.rowCount === 0) {
          console.log(`🔧 Migrating table ${table} to Multi-Branch architecture...`);
          await client.query(`ALTER TABLE ${table} ADD COLUMN branch_id UUID;`);
          // 8888 - Protection: Link orphans to default branch
          await client.query(`UPDATE ${table} SET branch_id = '${defaultBranchId}' WHERE branch_id IS NULL;`);
        }
      }

      // 4. Create other tables if they don't exist (Idempotent)
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
      
      // Ensure landing_settings exists
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

      // 8888 - Protection: Ensure Default Settings Exist in DB
      const settingsCheck = await client.query("SELECT id FROM landing_settings WHERE id = 1");
      if (settingsCheck.rowCount === 0) {
          await client.query(`
            INSERT INTO landing_settings (id, business_name, primary_color, secondary_color, template_id, slogan, about_text, address, contact_phone)
            VALUES (1, 'CitaPlanner Elite', '#630E14', '#C5A028', 'citaplanner', 'Gestión de Lujo Simplificada', 'Plataforma líder en gestión de citas y negocios de belleza.', 'Av. Principal 123, CDMX', '+52 55 1234 5678');
          `);
          console.log("✨ Default Landing Settings Created");
      }

      await client.query('COMMIT');
      console.log("✅ Aurum Protocol: Database Schema Synchronized");
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) { 
    console.error('❌ DB Init Error (520):', err); 
  }
};

initDB();

// --- MIDDLEWARE: Branch Context (319817318 - Macro Salvation) ---
const branchMiddleware = (req, res, next) => {
    const branchId = req.headers['x-branch-id'];
    req.branchId = branchId;
    next();
};

app.use(branchMiddleware);

// --- API ENDPOINTS ---

// 1. Branches
app.get('/api/branches', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM branches ORDER BY created_at ASC");
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/branches', async (req, res) => {
    const { name, address, phone, manager } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO branches (name, address, phone, manager) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, address, phone, manager]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 2. Products
app.get('/api/products', async (req, res) => {
    try {
        let query = "SELECT * FROM products";
        let params = [];
        
        if (req.branchId) {
            query += " WHERE branch_id = $1 OR branch_id IS NULL"; 
            params.push(req.branchId);
        }
        
        query += " ORDER BY name ASC";
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/products', async (req, res) => {
    const { name, sku, category, price, cost, stock, minStock, usage } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO products (name, sku, category, price, cost, stock, min_stock, usage, branch_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [name, sku, category, price, cost, stock, minStock, usage, req.branchId]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 3. Appointments
app.get('/api/appointments', async (req, res) => {
    try {
        let query = "SELECT * FROM appointments";
        let params = [];
        if (req.branchId) {
            query += " WHERE branch_id = $1";
            params.push(req.branchId);
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/appointments', async (req, res) => {
    const { title, startDateTime, endDateTime, clientName, clientPhone, status, professionalId, serviceId, notes, description } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO appointments 
            (title, start_datetime, end_datetime, client_name, client_phone, status, professional_id, service_id, notes, branch_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [title, startDateTime, endDateTime, clientName, clientPhone, status, professionalId, serviceId, notes || description, req.branchId]
        );
        
        if (result.rows[0].id) {
             await pool.query(
                "INSERT INTO integration_logs (platform, event_type, branch_id, status) VALUES ('Internal', 'APPOINTMENT_CREATED', $1, 'SUCCESS')",
                [req.branchId]
             );
        }

        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 4. Clients
app.get('/api/clients', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE role = 'CLIENT' ORDER BY name ASC");
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/clients', async (req, res) => {
    const { name, email, phone, skin_type, allergies, medical_conditions } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (name, email, phone, role, password, skin_type, allergies, medical_conditions, branch_id) VALUES ($1, $2, $3, 'CLIENT', '123', $4, $5, $6, $7) RETURNING *",
            [name, email, phone, skin_type, allergies, medical_conditions, req.branchId]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 5. WAHA Integration
app.post('/api/integrations/waha/send', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Missing parameters' });

    try {
        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, payload, branch_id, status) VALUES ('WAHA', 'SEND_MESSAGE_ATTEMPT', $1, $2, 'PENDING')",
            [JSON.stringify({ phone }), req.branchId]
        );

        const chatId = `${phone.replace(/\D/g, '')}@c.us`;
        
        const response = await axios.post(`${WAHA_URL}/api/sendText`, {
            session: 'default',
            chatId: chatId,
            text: message
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, response, branch_id, status) VALUES ('WAHA', 'SEND_MESSAGE_SUCCESS', $1, $2, 'SUCCESS')",
            [JSON.stringify(response.data), req.branchId]
        );

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('WAHA Error:', error.message);
        await pool.query(
            "INSERT INTO integration_logs (platform, event_type, response, branch_id, status) VALUES ('WAHA', 'SEND_MESSAGE_ERROR', $1, $2, 'ERROR')",
            [error.message, req.branchId]
        );
        res.status(502).json({ success: false, error: 'Integration Gateway Error' });
    }
});

// 6. Settings & Stats - FIXED: Explicit conversion of nulls to safe defaults
app.get('/api/settings/landing', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM landing_settings WHERE id = 1");
        let data;
        
        if (result.rows.length === 0) {
            data = { 
                business_name: 'CitaPlanner Elite', 
                primary_color: '#630E14',
                secondary_color: '#C5A028',
                template_id: 'citaplanner',
                slogan: 'Gestión de Lujo Simplificada',
                about_text: 'Plataforma líder en gestión de citas y negocios de belleza.',
                address: 'Av. Principal 123, CDMX',
                contact_phone: '+52 55 1234 5678',
                hero_image_url: ''
            };
        } else {
            data = result.rows[0];
        }

        // 8888 - Protection: Normalize Keys AND Force Defaults for Null Database Values
        // This ensures the frontend never receives null for critical fields
        const normalized = {
            businessName: data.business_name || 'CitaPlanner Elite',
            primaryColor: data.primary_color || '#630E14',
            secondaryColor: data.secondary_color || '#C5A028',
            templateId: data.template_id || 'citaplanner',
            slogan: data.slogan || 'Gestión de Lujo Simplificada',
            aboutText: data.about_text || 'Plataforma líder en gestión de citas.',
            address: data.address || 'Ubicación Central',
            contactPhone: data.contact_phone || '+52 55 0000 0000',
            heroImageUrl: data.hero_image_url || ''
        };

        res.json(normalized);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/settings/landing', async (req, res) => {
    const { businessName, primaryColor, secondaryColor, templateId, slogan, aboutText, address, contactPhone } = req.body;
    try {
        await pool.query(`
            INSERT INTO landing_settings (id, business_name, primary_color, secondary_color, template_id, slogan, about_text, address, contact_phone)
            VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
            business_name = EXCLUDED.business_name,
            primary_color = EXCLUDED.primary_color,
            secondary_color = EXCLUDED.secondary_color,
            template_id = EXCLUDED.template_id,
            slogan = EXCLUDED.slogan,
            about_text = EXCLUDED.about_text,
            address = EXCLUDED.address,
            contact_phone = EXCLUDED.contact_phone
        `, [businessName, primaryColor, secondaryColor, templateId, slogan, aboutText, address, contactPhone]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 7. Sales/POS
app.post('/api/sales', async (req, res) => {
    const { items, total, paymentMethod, clientName } = req.body;
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const transRes = await client.query(
                "INSERT INTO transactions (date, client_name, total, payment_method, items, branch_id) VALUES (NOW(), $1, $2, $3, $4, $5) RETURNING id",
                [clientName, total, paymentMethod, JSON.stringify(items), req.branchId]
            );

            for (const item of items) {
                if (item.type === 'PRODUCT') {
                    await client.query(
                        "UPDATE products SET stock = stock - $1 WHERE id = $2",
                        [item.quantity, item.id]
                    );
                }
            }

            await client.query('COMMIT');
            res.json({ success: true, saleId: transRes.rows[0].id, date: new Date() });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
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

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 AURUM NODE ACTIVE | Port: ${PORT} | WAHA: ${WAHA_URL}`));
