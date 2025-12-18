
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { answerServiceQuery } = require('./services/geminiService');

const app = express();

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:f235a94c666dd10167be@qhosting_citaplanner-db:5432/citaplanner-db?sslmode=disable';

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: DATABASE_URL });

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};
const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        avatar VARCHAR(5),
        birth_date DATE,
        preferences TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20) UNIQUE NOT NULL,
        notes TEXT,
        birth_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        duration INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS landing_settings (
        id SERIAL PRIMARY KEY,
        business_name VARCHAR(100),
        primary_color VARCHAR(20),
        secondary_color VARCHAR(20),
        template_id VARCHAR(20),
        slogan TEXT,
        about_text TEXT,
        hero_image_url TEXT,
        address TEXT,
        contact_phone VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        start_datetime TIMESTAMP NOT NULL,
        end_datetime TIMESTAMP NOT NULL,
        client_name VARCHAR(100),
        client_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        description TEXT,
        professional_id INT REFERENCES users(id),
        service_id INT REFERENCES services(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS integration_logs (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50),
        event_type VARCHAR(50),
        status VARCHAR(20),
        payload TEXT,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed data (omitted for brevity, assume same as before)
  } catch (err) { console.error('Error DB Init:', err); }
};
initDB();

const triggerExternalIntegrations = async (platform, eventType, data, response = null) => {
  try {
    await pool.query(
      "INSERT INTO integration_logs (platform, event_type, status, payload, response) VALUES ($1, $2, $3, $4, $5)",
      [platform, eventType, 'SUCCESS', JSON.stringify(data), response ? JSON.stringify(response) : null]
    );
  } catch (e) {
    console.error(`Error logging integration ${platform}:`, e);
  }
};

// --- WEBHOOK DE CHATWOOT (ENTRADA) ---
app.post('/api/webhooks/chatwoot', async (req, res) => {
  const { content, conversation, event } = req.body;

  // Solo procesamos mensajes nuevos entrantes
  if (event !== 'message_created' || !content) {
    return res.json({ ignored: true });
  }

  try {
    console.log(`[CHATWOOT WEBHOOK] Mensaje recibido: "${content}"`);

    // 1. Obtener catálogo de servicios actualizado
    const servicesRes = await pool.query("SELECT * FROM services WHERE status = 'ACTIVE'");
    const catalog = servicesRes.rows;

    // 2. Consultar a Gemini AI
    // Importamos dinámicamente o usamos el helper
    const aiResponse = await answerServiceQuery(content, catalog);

    // 3. Registrar el evento en el sistema
    await triggerExternalIntegrations('CHATWOOT', 'INBOUND_QUERY_AI_RESPONSE', { query: content }, { aiResponse });

    // 4. (SIMULACIÓN) Aquí se llamaría a la API de Chatwoot para enviar el mensaje de vuelta
    // fetch(`${CHATWOOT_API_URL}/conversations/${conversation.id}/messages`, { ... })

    res.json({ success: true, aiResponse });
  } catch (err) {
    console.error("Error en Webhook Chatwoot:", err);
    res.status(500).json({ error: "Fallo al procesar consulta de IA" });
  }
});

// --- RESTO DE ENDPOINTS ---
app.get('/api/settings/landing', async (req, res) => {
  const result = await pool.query("SELECT * FROM landing_settings LIMIT 1");
  if (result.rows.length > 0) res.json(result.rows[0]);
  else res.status(404).json({ error: 'Not found' });
});

app.get('/api/services', async (req, res) => {
  const result = await pool.query("SELECT * FROM services WHERE status = 'ACTIVE' ORDER BY category, name");
  res.json(result.rows.map(r => ({ ...r, id: r.id.toString(), price: parseFloat(r.price) })));
});

app.get('/api/appointments', async (req, res) => {
  const result = await pool.query("SELECT * FROM appointments ORDER BY start_datetime ASC");
  res.json(result.rows.map(r => ({ ...r, id: r.id.toString() })));
});

app.get('/api/integrations/status', async (req, res) => {
  try {
    const logs = await pool.query("SELECT platform, event_type, status, created_at, response FROM integration_logs ORDER BY created_at DESC LIMIT 15");
    res.json(logs.rows);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

app.listen(PORT, () => console.log(`🚀 CitaPlanner Infrastructure Server Activo en puerto ${PORT}`));
