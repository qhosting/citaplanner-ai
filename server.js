const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

// Configuración
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:f235a94c666dd10167be@qhosting_citaplanner-db:5432/citaplanner-db?sslmode=disable';

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a Postgres
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Helper para obtener configuración dinámica
const getSetting = async (key, defaultValue = '') => {
  try {
    const res = await pool.query("SELECT value FROM settings WHERE key = $1", [key]);
    if (res.rows.length > 0) return res.rows[0].value;
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

// Inicialización de Tablas
const initDB = async () => {
  try {
    // Tabla Usuarios
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
    `);

    // Tabla Configuración (Settings)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        category VARCHAR(50),
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Servicios (Catálogo)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        duration INT NOT NULL, -- Minutos
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Profesionales (Gestión de Horarios)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        birth_date DATE,
        weekly_schedule TEXT, -- JSON Stringified
        exceptions TEXT,      -- JSON Stringified
        service_ids TEXT,     -- JSON Array Stringified
        user_id INT,          -- Link to users table if exists
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        notes TEXT,
        birth_date DATE,
        preferences TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Citas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        start_datetime TIMESTAMP NOT NULL,
        end_datetime TIMESTAMP NOT NULL,
        client_name VARCHAR(100),
        client_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        description TEXT,
        professional_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Ventas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        total DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        discount_total DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(20) NOT NULL,
        client_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Items Venta
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INT REFERENCES sales(id),
        item_id VARCHAR(50) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        item_type VARCHAR(20) NOT NULL, -- PRODUCT | SERVICE
        discount_percent DECIMAL(5,2) DEFAULT 0
      );
    `);

    // Usuario Admin por defecto
    const adminCheck = await pool.query("SELECT * FROM users WHERE phone = 'admin'");
    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (name, phone, password, role, avatar)
        VALUES ('Admin Principal', 'admin', '123', 'ADMIN', 'AD')
      `);
      console.log('Usuario admin creado.');
    }

    // Datos semilla para Configuración
    const settingsCheck = await pool.query("SELECT * FROM settings");
    if (settingsCheck.rows.length === 0) {
      const defaultSettings = [
        ['business_name', 'Clínica Dental Sonrisas', 'GENERAL', 'Nombre público del negocio'],
        ['currency_symbol', '$', 'GENERAL', 'Símbolo de moneda'],
        ['tax_rate', '16', 'GENERAL', 'IVA o Impuesto por defecto (%)'],
        ['n8n_webhook_general', 'https://n8n.tu-dominio.com/webhook/general', 'INTEGRATION', 'Webhook principal de N8N'],
        ['n8n_webhook_marketing', 'https://n8n.tu-dominio.com/webhook/marketing', 'INTEGRATION', 'Webhook para campañas masivas'],
        ['odoo_webhook', 'https://n8n.tu-dominio.com/webhook/odoo-sync', 'INTEGRATION', 'Webhook sincronización Odoo'],
        ['chatwoot_url', 'https://app.chatwoot.com/api/v1', 'INTEGRATION', 'URL API Chatwoot'],
        ['chatwoot_token', '', 'INTEGRATION', 'Token de acceso Chatwoot'],
        ['chatwoot_account_id', '1', 'INTEGRATION', 'ID de Cuenta Chatwoot'],
        ['chatwoot_inbox_id', '1', 'INTEGRATION', 'ID de Bandeja de entrada']
      ];
      
      for (const s of defaultSettings) {
        await pool.query("INSERT INTO settings (key, value, category, description) VALUES ($1, $2, $3, $4)", s);
      }
      console.log('Configuraciones por defecto cargadas.');
    }

    // Servicios Semilla
    const serviceCheck = await pool.query("SELECT * FROM services");
    if (serviceCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO services (name, duration, price, category, description) VALUES
        ('Consulta General', 30, 50.00, 'General', 'Evaluación inicial y diagnóstico general.'),
        ('Limpieza Dental', 60, 80.00, 'Odontología', 'Limpieza profunda con ultrasonido.'),
        ('Blanqueamiento', 90, 150.00, 'Estética', 'Tratamiento estético avanzado.'),
        ('Ortodoncia Revisión', 20, 40.00, 'Ortodoncia', 'Ajuste mensual de brackets.')
      `);
      console.log('Servicios semilla creados.');
    }

    // Profesionales Semilla
    const proCheck = await pool.query("SELECT * FROM professionals");
    if (proCheck.rows.length === 0) {
      const defaultSchedule = JSON.stringify([
         { dayOfWeek: 1, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
         { dayOfWeek: 2, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
         { dayOfWeek: 3, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
         { dayOfWeek: 4, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
         { dayOfWeek: 5, isEnabled: true, slots: [{ start: '09:00', end: '15:00' }] },
         { dayOfWeek: 6, isEnabled: false, slots: [] },
         { dayOfWeek: 0, isEnabled: false, slots: [] }
      ]);
      
      // Asignar IDs de servicios (como strings en JSON array)
      await pool.query(`
        INSERT INTO professionals (name, role, email, weekly_schedule, exceptions, service_ids)
        VALUES 
        ('Dra. Ana López', 'Odontóloga General', 'ana@example.com', $1, '[]', '["1", "2", "3"]'),
        ('Dr. Carlos Ruiz', 'Ortodoncista', 'carlos@example.com', $1, '[]', '["1", "4"]')
      `, [defaultSchedule]);
      console.log('Profesionales semilla creados.');
    }

    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error inicializando DB:', err);
  }
};

initDB();

// --- RUTAS API ---

// 1. Configuración (Settings)
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM settings ORDER BY category, key");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/batch', async (req, res) => {
  const { settings } = req.body; // Array of { key, value }
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    for (const s of settings) {
      await client.query("UPDATE settings SET value = $1 WHERE key = $2", [s.value, s.key]);
    }
    await client.query('COMMIT');
    res.json({ success: true, message: 'Configuración actualizada' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Servicios (CRUD)
app.get('/api/services', async (req, res) => {
  const { all } = req.query;
  try {
    let query = "SELECT * FROM services";
    // Por defecto solo activos, si all=true trae todo
    if (!all || all !== 'true') {
       query += " WHERE status = 'ACTIVE'";
    }
    query += " ORDER BY name ASC";
    
    const result = await pool.query(query);
    const services = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      duration: row.duration,
      price: parseFloat(row.price),
      description: row.description,
      category: row.category,
      status: row.status
    }));
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { name, duration, price, category, description, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO services (name, duration, price, category, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, duration, price, category, description, status || 'ACTIVE']
    );
    const row = result.rows[0];
    res.json({
      id: row.id.toString(),
      name: row.name,
      duration: row.duration,
      price: parseFloat(row.price),
      description: row.description,
      category: row.category,
      status: row.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, duration, price, category, description, status } = req.body;
  try {
    await pool.query(
      `UPDATE services 
       SET name = $1, duration = $2, price = $3, category = $4, description = $5, status = $6
       WHERE id = $7`,
      [name, duration, price, category, description, status, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1 AND password = $2', [phone, password]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      user.id = user.id.toString();
      // Parsear preferencias si existen
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = { whatsapp: true, sms: true, email: true };
        }
      } else {
        user.preferences = { whatsapp: true, sms: true, email: true };
      }
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar Preferencias de Perfil
app.post('/api/profile/preferences', async (req, res) => {
  const { userId, preferences } = req.body;
  
  if (!userId || !preferences) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const prefsString = JSON.stringify(preferences);
    await pool.query('UPDATE users SET preferences = $1 WHERE id = $2', [prefsString, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando preferencias:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- API PROFESIONALES (HORARIOS) ---

app.get('/api/professionals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM professionals ORDER BY name ASC');
    const professionals = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      role: row.role,
      email: row.email,
      phone: row.phone,
      birthDate: row.birth_date ? row.birth_date.toISOString().split('T')[0] : null, // Simplificar fecha
      weeklySchedule: row.weekly_schedule ? JSON.parse(row.weekly_schedule) : [],
      exceptions: row.exceptions ? JSON.parse(row.exceptions) : [],
      serviceIds: row.service_ids ? JSON.parse(row.service_ids) : []
    }));
    res.json(professionals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/professionals/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, email, birthDate, weeklySchedule, exceptions, serviceIds } = req.body;
  
  try {
    await pool.query(
      `UPDATE professionals 
       SET name = $1, role = $2, email = $3, birth_date = $4, weekly_schedule = $5, exceptions = $6, service_ids = $7
       WHERE id = $8`,
      [
        name, 
        role, 
        email, 
        birthDate, 
        JSON.stringify(weeklySchedule), 
        JSON.stringify(exceptions), 
        JSON.stringify(serviceIds),
        id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando profesional:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/professionals', async (req, res) => {
  const { name, role, email, weeklySchedule } = req.body;
  try {
     const result = await pool.query(
       `INSERT INTO professionals (name, role, email, weekly_schedule, exceptions)
        VALUES ($1, $2, $3, $4, '[]') RETURNING id`,
       [name, role, email, JSON.stringify(weeklySchedule)]
     );
     res.json({ success: true, id: result.rows[0].id.toString() });
  } catch (err) {
     res.status(500).json({ error: err.message });
  }
});


// Obtener Citas
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY start_datetime ASC');
    const appointments = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      startDateTime: row.start_datetime,
      endDateTime: row.end_datetime,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      status: row.status,
      description: row.description,
      professionalId: row.professional_id ? row.professional_id.toString() : undefined
    }));
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear Cita
app.post('/api/appointments', async (req, res) => {
  const { title, startDateTime, endDateTime, clientName, clientPhone, description, status, professionalId } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO appointments (title, start_datetime, end_datetime, client_name, client_phone, description, status, professional_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, startDateTime, endDateTime, clientName, clientPhone, description, status || 'SCHEDULED', professionalId]
    );
    
    const row = result.rows[0];
    const newAppointment = {
      id: row.id.toString(),
      title: row.title,
      startDateTime: row.start_datetime,
      endDateTime: row.end_datetime,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      status: row.status,
      description: row.description,
      professionalId: row.professional_id ? row.professional_id.toString() : undefined
    };
    
    res.json(newAppointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar Estado Cita
app.patch('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE appointments SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API POS (VENTAS) ---
app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciar Transacción

    const { items, paymentMethod, total, subtotal, discountTotal, clientName } = req.body;

    // 1. Insertar Venta
    const saleResult = await client.query(
      `INSERT INTO sales (total, subtotal, discount_total, payment_method, client_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [total, subtotal, discountTotal, paymentMethod, clientName]
    );
    const saleId = saleResult.rows[0].id;

    // 2. Procesar Items y Actualizar Inventario
    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (sale_id, item_id, item_name, quantity, price, item_type, discount_percent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [saleId, item.id, item.name, item.quantity, item.price, item.type, item.discount]
      );
    }

    await client.query('COMMIT'); // Confirmar Transacción
    res.json({ success: true, saleId, date: saleResult.rows[0].created_at });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error procesando venta:', err);
    res.status(500).json({ error: 'Error procesando la venta' });
  } finally {
    client.release();
  }
});

// --- RUTAS DE INTEGRACIÓN Y AUTOMATIZACIÓN ---

// 1. Obtener cumpleañeros de hoy (Para Dashboard)
app.get('/api/birthdays/today', async (req, res) => {
    // Simulación: En producción usar:
    // const result = await pool.query("SELECT * FROM clients WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE)");
    
    // Devolvemos datos mockeados para que la UI funcione
    const mockBirthdays = [
        { id: '1', name: 'Maria Garcia', role: 'Cliente', date: new Date().toISOString() },
        { id: 'u2', name: 'Dra. Ana López', role: 'Profesional', date: new Date().toISOString() }
    ];
    res.json(mockBirthdays);
});

// 2. Endpoint para revisión diaria de cumpleaños y ENVÍO (Llamado por Cron Job externo)
app.post('/api/integrations/birthdays/check', async (req, res) => {
  console.log('[Birthday Auto-Check] Iniciando proceso batch...');
  
  // 1. Buscar personas (Clientes y Usuarios Profesionales) que cumplan años hoy
  // Mock Data con Preferencias
  const birthdaysFound = [
    { 
        name: 'Maria Garcia', 
        phone: '5512345678', 
        type: 'CLIENT', 
        preferences: { whatsapp: true, sms: false } 
    },
    { 
        name: 'Dra. Ana López', 
        phone: '5551001', 
        type: 'PROFESSIONAL', 
        preferences: { whatsapp: false, sms: true } // Prefiere SMS
    },
    { 
        name: 'Pedro (No Molestar)', 
        phone: '5559999', 
        type: 'CLIENT', 
        preferences: { whatsapp: false, sms: false } 
    }
  ];

  const actionsTaken = [];

  // 2. Iterar y enviar según preferencias
  for (const person of birthdaysFound) {
      if (!person.phone) continue;

      let sent = false;
      const message = `¡Feliz Cumpleaños ${person.name}! Te deseamos lo mejor en tu día. - CitaPlanner`;

      // Prioridad 1: WhatsApp (Si está activo)
      if (person.preferences.whatsapp) {
          console.log(`[Batch] Enviando WhatsApp a ${person.name}`);
          // triggerN8NWorkflow('SEND_BIRTHDAY_WA', { phone: person.phone, message });
          actionsTaken.push({ name: person.name, channel: 'WhatsApp', status: 'SENT' });
          sent = true;
      } 
      
      // Prioridad 2: SMS (Si WA desactivado y SMS activo)
      if (!sent && person.preferences.sms) {
          console.log(`[Batch] Enviando SMS a ${person.name}`);
          // triggerN8NWorkflow('SEND_BIRTHDAY_SMS', { phone: person.phone, message });
          actionsTaken.push({ name: person.name, channel: 'SMS', status: 'SENT' });
          sent = true;
      }

      if (!sent) {
          actionsTaken.push({ name: person.name, channel: 'NONE', status: 'SKIPPED (Preferences)' });
      }
  }

  res.json({ 
    success: true, 
    processed: birthdaysFound.length,
    actions: actionsTaken,
    message: `Proceso finalizado. ${actionsTaken.filter(a => a.status === 'SENT').length} notificaciones enviadas.` 
  });
});

// --- MARKETING & COMUNICACIONES ---

// Enviar Campaña (Llama al Webhook de N8N configurado en DB)
app.post('/api/marketing/campaigns/send', async (req, res) => {
  const { campaign } = req.body;
  console.log(`[Marketing] Enviando campaña: ${campaign.name} vía ${campaign.channel}`);
  
  try {
    // Obtener webhook dinámico
    const webhookUrl = await getSetting('n8n_webhook_marketing');
    
    // Simulamos la llamada a N8N
    // En producción: await axios.post(webhookUrl, campaign);
    
    // Simulamos un retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const estimatedAudience = campaign.targetSegment === 'ALL' ? 150 : 45;
    
    res.json({ 
      success: true, 
      sentCount: estimatedAudience,
      message: `Campaña enviada a ${estimatedAudience} destinatarios usando ${webhookUrl}` 
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({ success: false, message: "Error al conectar con el servidor de envíos." });
  }
});

// Guardar Regla de Automatización
app.post('/api/marketing/automations', async (req, res) => {
  const { rule } = req.body;
  console.log(`[Marketing] Guardando regla de automatización: ${rule.triggerType}`);
  // Aquí se guardaría en DB la configuración para que el worker/cron la lea
  res.json({ success: true });
});

// 1. Integración con N8N (General / WhatsApp / SMS)
app.post('/api/integrations/n8n', async (req, res) => {
  const { action, payload } = req.body;
  
  // Obtener webhook dinámico general
  const webhookUrl = await getSetting('n8n_webhook_general');
  
  console.log(`[N8N] Disparando acción: ${action} a ${webhookUrl}`);
  
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: `Workflow ${action} enviado a N8N`, 
      webhookUsed: webhookUrl 
    });
  }, 500);
});

// 2. Integración con Odoo
app.post('/api/integrations/odoo', async (req, res) => {
  const { entity, operation, data } = req.body;
  const webhookUrl = await getSetting('odoo_webhook');
  console.log(`[Odoo] Sincronizando ${entity} (${operation}) a ${webhookUrl}`);
  setTimeout(() => {
    res.json({ success: true, message: 'Datos enviados a Odoo' });
  }, 500);
});

// 3. Integración con Chatwoot
app.post('/api/integrations/chatwoot', async (req, res) => {
  const appointment = req.body;
  if (!appointment.clientPhone) {
    return res.status(400).json({ error: 'El cliente no tiene teléfono' });
  }
  
  const cwUrl = await getSetting('chatwoot_url');
  const cwToken = await getSetting('chatwoot_token');
  
  console.log(`[Chatwoot] Sync para ${appointment.clientPhone} en ${cwUrl}`);
  
  res.json({ success: true, contactId: 123, conversationId: 456 });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Conectando a Postgres: ${DATABASE_URL.split('@')[1]}`);
});