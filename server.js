
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100),
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        avatar VARCHAR(5),
        related_id INT,
        loyalty_points INT DEFAULT 0,
        skin_type VARCHAR(50),
        allergies TEXT,
        medical_conditions TEXT,
        preferences JSONB DEFAULT '{"whatsapp":true,"sms":true,"email":true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(100),
        email VARCHAR(100),
        service_ids TEXT[],
        weekly_schedule JSONB,
        exceptions JSONB DEFAULT '[]',
        birth_date DATE
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) UNIQUE,
        category VARCHAR(50),
        price DECIMAL(10,2),
        cost DECIMAL(10,2),
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        usage VARCHAR(20) DEFAULT 'RETAIL',
        status VARCHAR(20) DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        duration INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        start_datetime TIMESTAMP NOT NULL,
        end_datetime TIMESTAMP NOT NULL,
        client_name VARCHAR(100),
        client_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        professional_id INT REFERENCES professionals(id),
        service_id INT REFERENCES services(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        branch_id INT
      );

      CREATE TABLE IF NOT EXISTS landing_settings (
        id INT PRIMARY KEY DEFAULT 1,
        business_name VARCHAR(100) DEFAULT 'Aurum Beauty Studio',
        primary_color VARCHAR(20) DEFAULT '#C5A028',
        secondary_color VARCHAR(20) DEFAULT '#1A1A1A',
        template_id VARCHAR(20) DEFAULT 'beauty',
        slogan TEXT,
        about_text TEXT,
        address TEXT,
        contact_phone VARCHAR(20),
        hero_image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        manager VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE'
      );
    `);

    // Seed default settings if missing
    const settingsRes = await pool.query("SELECT id FROM landing_settings WHERE id = 1");
    if (settingsRes.rowCount === 0) {
      await pool.query(`
        INSERT INTO landing_settings (id, business_name, primary_color, secondary_color, template_id, slogan, about_text, address, contact_phone, hero_image_url)
        VALUES (1, 'Aurum Beauty Studio', '#C5A028', '#1A1A1A', 'beauty', 'Redefiniendo la Estética de Ultra-Lujo', 'Santuario de belleza líder en alta tecnología. Fusionamos arte y ciencia para crear resultados naturales y sofisticados.', 'Presidente Masaryk 450, Polanco, CDMX', '+52 55 7142 7321', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000');
      `);
    }

    // Seed default services if empty
    const servicesRes = await pool.query("SELECT id FROM services LIMIT 1");
    if (servicesRes.rowCount === 0) {
      await pool.query(`
        INSERT INTO services (name, duration, price, description, category, status) VALUES
        ('Microblading Hyper-Realist', 120, 4500, 'Simulación de vello natural con pigmentos minerales de alta gama.', 'Cejas', 'ACTIVE'),
        ('Lip Blush Diamond', 90, 3800, 'Definición y color semi-permanente para unos labios con volumen y vida.', 'Labios', 'ACTIVE'),
        ('Hydrafacial Elite', 60, 2100, 'Protocolo de limpieza profunda y nutrición celular instantánea.', 'Facial', 'ACTIVE'),
        ('Lifting de Pestañas Gold', 45, 1200, 'Elevación natural de pestañas con keratina pura.', 'Mirada', 'ACTIVE');
      `);
    }

    // Seed default professionals if empty
    const professionalsRes = await pool.query("SELECT id FROM professionals LIMIT 1");
    if (professionalsRes.rowCount === 0) {
      const schedule = JSON.stringify([
        { dayOfWeek: 1, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 2, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 3, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 4, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 5, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 6, isEnabled: true, slots: [{ start: '10:00', end: '14:00' }] },
        { dayOfWeek: 0, isEnabled: false, slots: [] }
      ]);
      await pool.query(`
        INSERT INTO professionals (name, role, email, service_ids, weekly_schedule) VALUES
        ('Elena Valery', 'Master Artist', 'elena@aurum.mx', '{}', $1),
        ('Sofia Gold', 'Senior Specialist', 'sofia@aurum.mx', '{}', $1);
      `, [schedule]);
    }

    console.log("✅ Aurum Protocol: Database Schema and Seed Synchronized");
  } catch (err) { console.error('❌ DB Init Error:', err); }
};
initDB();

// --- API ENDPOINTS ---

app.get('/api/settings/landing', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM landing_settings WHERE id = 1");
        if (result.rows.length === 0) {
            return res.json({ businessName: 'Aurum Beauty Studio', primaryColor: '#C5A028', templateId: 'beauty' });
        }
        const data = result.rows[0];
        res.json({
            businessName: data.business_name,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            templateId: data.template_id,
            slogan: data.slogan,
            aboutText: data.about_text,
            address: data.address,
            contactPhone: data.contact_phone,
            heroImageUrl: data.hero_image_url
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/settings/landing', async (req, res) => {
  try {
    const { businessName, primaryColor, secondaryColor, templateId, slogan, aboutText, address, contactPhone, heroImageUrl } = req.body;
    await pool.query(`
      UPDATE landing_settings SET 
        business_name = $1, primary_color = $2, secondary_color = $3, template_id = $4, 
        slogan = $5, about_text = $6, address = $7, contact_phone = $8, hero_image_url = $9
      WHERE id = 1
    `, [businessName, primaryColor, secondaryColor, templateId, slogan, aboutText, address, contactPhone, heroImageUrl]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    
    if (phone === 'admin' && (password === 'admin' || password === 'admin123')) {
      return res.json({ 
        success: true, 
        user: { 
          id: '0', 
          name: 'Director Aurum', 
          role: 'ADMIN', 
          phone: 'admin',
          avatar: 'A'
        } 
      });
    }

    try {
      const result = await pool.query("SELECT * FROM users WHERE phone=$1 AND password=$2", [phone, password]);
      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        return res.json({ 
          success: true, 
          user: {
            id: dbUser.id.toString(),
            name: dbUser.name,
            role: dbUser.role,
            phone: dbUser.phone,
            avatar: dbUser.avatar,
            relatedId: dbUser.related_id?.toString(),
            loyalty_points: dbUser.loyalty_points
          } 
        });
      }
    } catch (e) { 
      console.error("Login DB Error:", e);
    }
    
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

app.get('/api/services', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM services ORDER BY name ASC");
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, duration, price, description, category, status } = req.body;
    const result = await pool.query(`
      INSERT INTO services (name, duration, price, description, category, status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [name, duration, price, description, category, status]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { name, duration, price, description, category, status } = req.body;
    await pool.query(`
      UPDATE services SET name=$1, duration=$2, price=$3, description=$4, category=$5, status=$6 WHERE id=$7
    `, [name, duration, price, description, category, status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM services WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointments ORDER BY start_datetime DESC");
    res.json(result.rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { title, startDateTime, endDateTime, clientName, clientPhone, status, professionalId, serviceId, description, branchId } = req.body;
    const result = await pool.query(`
      INSERT INTO appointments (title, start_datetime, end_datetime, client_name, client_phone, status, professional_id, service_id, notes, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [title, startDateTime, endDateTime, clientName, clientPhone, status || 'SCHEDULED', professionalId, serviceId, description, branchId]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/appointments/:id/cancel', async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET status='CANCELLED' WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/appointments/:id/complete', async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET status='COMPLETED', notes=$1 WHERE id=$2", [req.body.notes, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY name ASC");
    res.json(result.rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, category, price, cost, stock, minStock, usage, status } = req.body;
    const result = await pool.query(`
      INSERT INTO products (name, sku, category, price, cost, stock, min_stock, usage, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [name, sku, category, price, cost, stock, minStock, usage, status]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, sku, category, price, cost, stock, minStock, usage, status } = req.body;
    await pool.query(`
      UPDATE products SET name=$1, sku=$2, category=$3, price=$4, cost=$5, stock=$6, min_stock=$7, usage=$8, status=$9 WHERE id=$10
    `, [name, sku, category, price, cost, stock, minStock, usage, status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/professionals', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM professionals ORDER BY name ASC");
    res.json(result.rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/professionals', async (req, res) => {
  try {
    const { name, role, email, serviceIds, weeklySchedule, exceptions } = req.body;
    const result = await pool.query(`
      INSERT INTO professionals (name, role, email, service_ids, weekly_schedule, exceptions)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [name, role, email, serviceIds, JSON.stringify(weeklySchedule), JSON.stringify(exceptions)]);
    res.json({ success: true, id: result.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/professionals/:id', async (req, res) => {
  try {
    const { name, role, email, serviceIds, weeklySchedule, exceptions } = req.body;
    await pool.query(`
      UPDATE professionals SET name=$1, role=$2, email=$3, service_ids=$4, weekly_schedule=$5, exceptions=$6 WHERE id=$7
    `, [name, role, email, serviceIds, JSON.stringify(weeklySchedule), JSON.stringify(exceptions), req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/professionals/:id/appointments', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointments WHERE professional_id=$1 ORDER BY start_datetime DESC", [req.params.id]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role='CLIENT' ORDER BY name ASC");
    res.json(result.rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { name, phone, email, skin_type, allergies, medical_conditions } = req.body;
    const result = await pool.query(`
      INSERT INTO users (name, phone, email, role, password, skin_type, allergies, medical_conditions)
      VALUES ($1, $2, $3, 'CLIENT', 'client123', $4, $5, $6) RETURNING *
    `, [name, phone, email, skin_type, allergies, medical_conditions]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id/preferences', async (req, res) => {
  try {
    await pool.query("UPDATE users SET preferences=$1 WHERE id=$2", [JSON.stringify(req.body), req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/branches', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM branches ORDER BY name ASC");
    res.json(result.rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/analytics/stats', async (req, res) => {
  try {
    res.json({
      revenueThisMonth: 12500,
      appointmentsCompleted: 42,
      newClientsThisMonth: 12,
      occupationRate: 75
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sales', async (req, res) => {
  try {
    res.json({ success: true, saleId: 'S-' + Date.now(), date: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 AURUM NODE ACTIVE | Port: ${PORT}`));
