# CitaPlanner AI 🪙

> **SaaS Engine v3.2.0** — Plataforma de gestión de reservas y clientes para negocios de estética, salud y bienestar. Potenciada por IA (Google Gemini) e integrada con WhatsApp, MercadoPago, y calendarios Google.

---

## ✨ Características Principales

| Módulo | Descripción |
|---|---|
| **Smart Scheduler** | Crea citas con lenguaje natural vía Gemini AI |
| **Dashboard** | Vista centralizada con KPIs, filtros y estado en tiempo real |
| **CRM de Clientes** | Historial de tratamientos, consentimientos, diagnóstico de pestañas |
| **Inventario** | Control de stock con alertas automáticas de umbral bajo |
| **POS** | Punto de venta integrado con cobro en caja y deducción de stock |
| **Marketing** | Campañas de WhatsApp masivas con plantillas y automatización |
| **Web Architect** | Constructor visual de landing page (6 templates) con SEO automático |
| **Leads CRM** | Captación de leads desde WhatsApp Flows y formularios web |
| **WhatsApp Flows** | Booking interactivo directamente en WhatsApp (Meta Cloud API) |
| **Analytics** | Insights de negocio: ingresos, no-shows, clientes top, tendencias |
| **Multi-Sucursal** | Soporte para múltiples branches con tenancy compartido |
| **PWA** | Progressive Web App instalable en iOS, Android y Desktop |

---

## 🛠 Stack Tecnológico

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS (Aurum Gold design system: `#D4AF37`)
- React Query (TanStack), Sonner (toasts), Lucide React
- Socket.io client (tiempo real), Recharts (gráficas)

**Backend**
- Node.js + Express.js (ESM)
- Prisma ORM + PostgreSQL
- Redis (caché, limiter)
- Socket.io (WebSockets)
- bcryptjs + JWT (auth)
- Helmet, CORS, Rate Limiting

**IA & Integraciones**
- Google Gemini 2.5 Flash (predicción no-shows, smart scheduler, sugerencias)
- WAHA (WhatsApp HTTP API) / WhatsApp Cloud API (Meta)
- MercadoPago + OpenPay (pagos)
- Google Calendar OAuth2
- Nodemailer (email)
- Web Push (notificaciones push)

---

## ⚙️ Configuración

### 1. Clonar y preparar

```bash
git clone https://github.com/qhosting/citaplanner-ai.git
cd citaplanner-ai
npm install
cp .env.example .env
```

### 2. Variables de entorno (`.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/citaplanner_dev"

# Redis (opcional — caching)
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development
DOMAIN_URL=http://localhost:5173
ROOT_DOMAIN=localhost

# Dev bypass (solo desarrollo local)
DEV_BYPASS_ENABLED=false

# Auth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
JWT_SECRET="your-jwt-secret"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CitaPlanner <noreply@citaplanner.com>"

# WhatsApp (WAHA)
WAHA_URL=http://localhost:3001
WAHA_SESSION=default

# MercadoPago
MP_ACCESS_TOKEN=your-mp-access-token
MP_WEBHOOK_SECRET=your-webhook-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# VAPID (Web Push)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:admin@citaplanner.com
```

### 3. Base de datos

```bash
# Crear y migrar la base de datos
npx prisma db push

# Seedear datos de demostración
node prisma/seed.js
```

### 4. Ejecutar en desarrollo

```bash
# Terminal 1: Backend (Express)
node server.js

# Terminal 2: Frontend (Vite)
npm run dev
```

El frontend estará en `http://localhost:5173` y el backend en `http://localhost:3000`.

---

## 🧪 Tests

```bash
# Ejecutar suite de tests (vitest)
npm run test:run

# Watch mode
npm run test
```

La suite incluye tests E2E del servidor: CRUD de citas, predicción Gemini, WhatsApp Flows webhook.

---

## 🏗 Build para Producción

```bash
npm run build
```

El bundle se genera en `dist/` con:
- Code splitting por vendors (react, ui, charts, xlsx, cloud)
- PWA con service worker (Workbox)
- CSS minificado

---

## 📁 Estructura del Proyecto

```
citaplanner-ai/
├── pages/          # Páginas React (lazy-loaded)
├── components/     # Componentes reutilizables
├── context/        # AuthContext, ThemeContext
├── services/       # api.ts, socket.ts, geminiPredictionService
├── hooks/          # Custom hooks
├── middleware/     # Validación Express (validation.js)
├── schemas/        # Zod schemas (index.js)
├── prisma/         # Schema + seed
├── scripts/        # Scripts admin (reset, inject)
├── tests/          # Suite de tests (vitest)
└── server.js       # Servidor Express principal
```

---

## 🔐 Seguridad

- Passwords hasheadas con bcrypt (cost factor 10)
- JWT para sesiones con refresh tokens
- Rate limiting en login (`loginLimiter`)
- Helmet para headers HTTP seguros
- CORS configurado por dominio
- Error messages sanitizados en producción (no expone stack traces)
- Dev bypass requiere `DEV_BYPASS_ENABLED=true` explícito

---

## 📄 Licencia

Propietario — © 2024-2026 QHosting. Todos los derechos reservados.
