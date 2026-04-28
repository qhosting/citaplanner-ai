# 📋 ROADMAP - CitaPlanner AI
## Estado Actual del Sistema (Aurum Nexus v6.4)

---

## 🏗️ **STACK TECNOLÓGICO**

### **Frontend**
- [x] **React 19.0.0** - Framework principal
- [x] **TypeScript 5.8.2** - Tipado estático
- [x] **Vite 6.4.1** - Build tool y dev server
- [x] **Tailwind CSS 4.2.1** - Motor de estilos (CSS-first)
- [x] **React Router DOM 6.28.0** - Enrutamiento SPA
- [x] **React Hook Form 7.54.1** - Gestión de formularios
- [x] **Zod 3.24.1** - Validación de esquemas
- [x] **TanStack Query 5.62.7** - Estado y caché de servidor
- [x] **Lucide React 0.475.0** - Sistema de íconos
- [x] **Sonner 1.7.0** - Notificaciones toast

### **Backend**
- [x] **Node.js 20** (Alpine) - Runtime
- [x] **Express 5.2.1** - Framework HTTP
- [x] **PostgreSQL 15** - Base de datos principal
- [x] **Prisma ORM 6.3.0** - Gestión de base de datos e Introspección
- [x] **Redis 5.10.0** - Caché y sesiones
- [x] **CORS 2.8.5** - Seguridad cross-origin
- [x] **Bcryptjs 2.4.3** - Hash de seguridad para contraseñas
- [x] **Express Rate Limit 7.5.0** - Protección contra fuerza bruta

### **Integraciones**
- [x] **Google GenAI 1.33.0** - IA conversacional (Gemini 2.5 Flash)
- [x] **Google APIs 170.1.0** - Integración con servicios Google
- [x] **Mercado Pago 2.12.0** - Gateway de pagos
- [x] **Nodemailer 7.0.13** - Envío de correos
- [x] **Web Push 3.6.7** - Notificaciones push

### **DevOps & Infraestructura**
- [x] **Docker Multi-Stage** - Containerización optimizada
- [x] **Docker Compose 3.8** - Orquestación local
- [x] **PostgreSQL Client** - Herramientas de backup
- [x] **MongoDB Tools** - Migración/backup opcional
- [x] **Node Cron 4.2.1** - Tareas programadas
- [x] **Archiver 7.0.1** - Compresión de backups

---

## 🎯 **FUNCIONALIDADES IMPLEMENTADAS**

### **Módulo de Autenticación**
- [x] Sistema de Login con JWT
- [x] **Seguridad**: Hash de contraseñas (Bcrypt) y Validación de Inputs (Zod)
- [x] **Protección**: Rate limiting activo en /api/login
- [x] Bypass de desarrollo (modo dev)
- [x] Gestión de sesiones con Redis
- [x] Multi-tenant con caché de tenants (TTL: 5 min)
- [x] Roles: ADMIN, PROFESSIONAL, CLIENT, SUPER_ADMIN

### **Módulo de Agendamiento (Bookings)**
- [x] Creación de citas con validación de horarios
- [x] Filtros avanzados (estado, fecha, profesional)
- [x] Asociación automática cliente-profesional
- [x] Notificaciones push a profesionales
- [x] Notificaciones WhatsApp/Email a clientes
- [x] Estados: SCHEDULED, COMPLETED, CANCELLED

### **Módulo de Clientes (CRM)**
- [x] Directorio de clientes con búsqueda
- [x] Almacenamiento de datos de contacto
- [x] Historial de citas por cliente
- [x] Preferencias de notificación (WhatsApp/Email)

### **Módulo de Profesionales (Master Matrix)**
- [x] **Arquitectura de Matriz**: Gestión multi-especialista en tiempo real.
- [x] **Horarios Dinámicos**: Configuración de jornada base y excepciones (bloqueos).
- [x] **iCal Sync**: Integración con calendarios externos (Apple/Outlook).
- [x] **Intelligence Header**: Monitoreo de ocupación y recomendaciones AI.

### **Punto de Venta (POS)**
- [x] Catálogo de productos/servicios
- [x] Carrito de compras
- [x] Integración con Mercado Pago
- [x] Generación de preferencias de pago
- [x] Modo mock para desarrollo sin credenciales

### **Marketing & Campañas**
- [x] Creación de campañas multicanal
- [x] Segmentación por audiencia (tags, clientes)
- [x] Envío automático vía Email/WhatsApp
- [x] Tracking de campañas enviadas

### **Analytics & Intelligence Hub**
- [x] **Métricas en Tiempo Real**: Eliminación de mocks en `/analytics`.
- [x] **KPI Live Bindings**: Conexión de ingresos, citas y clientes con Prisma.
- [x] **Revenue Flow**: Gráficos de flujo financiero basados en ventas reales.
- [x] **Service Mix & Top Products**: Análisis dinámico de rendimiento por categoría.
- [x] **AI Strategy Master**: Integración de Gemini para análisis DAFO automatizado.

### **Gestión Multi-Branch**
- [x] Soporte para múltiples sucursales
- [x] Caché por sucursal (productos, settings)
- [x] Aislamiento de datos por branch
- [x] **Modo Monotenant**: Soporte para despliegue dedicado vía `ORGANIZATION_ID`.


### **Integraciones**
- [x] Google Cloud (setup documentado en GOOGLE_CLOUD_SETUP.md)
- [x] Cloudflare para CDN/DNS
- [x] Servicio de backups automáticos (PostgreSQL/MongoDB)
- [x] Web Push (VAPID keys configuradas)

### **PWA (Progressive Web App)**
- [x] Manifest.json configurado
- [x] Vite PWA Plugin integrado
- [x] Service Worker para offline
- [x] Instalable en dispositivos móviles
- [x] **Optimización iOS/Android**: Mejoras en la experiencia nativa y splash screens.
- [x] **Branding Dinámico**: Eliminación de flash "Citaplanner" en carga inicial.


---

## 🐳 **CONTENEDORES DOCKER**

### **citaplanner-db** (PostgreSQL 15-alpine)
- [x] Usuario: `citaplanner_admin`
- [x] Database: `citaplanner_prod`
- [x] Volumen persistente: `postgres_data`
- [x] Red interna: `citaplanner_internal`

### **citaplanner-app** (Node 20-alpine)
- [x] Build Multi-Stage (builder + runner)
- [x] Frontend servido desde `/app/dist`
- [x] Backend en Node.js (server.js)
- [x] Prisma Client regenerado en cada despliegue
- [x] Sistema de auto-migraciones atómico (Aurum Nexus v5.1)
- [x] Volumen de uploads: `uploads_data`
- [x] Puerto expuesto: **3000**
- [x] **Configuración IDE**: Soporte para `@theme` y reglas personalizadas en VS Code.


---

## 📦 **ESTRUCTURA DEL PROYECTO**

```
citaplanner-ai/
├── pages/              # 19 páginas React (Dashboard, POS, Analytics, etc.)
├── components/         # 14 componentes reutilizables
├── services/           # 6 servicios (API, Gemini, Backup, Cloudflare, etc.)
├── context/            # AuthContext (gestión de estado global)
├── utils/              # Utilidades (webPush)
├── prisma/             # Esquema sincronizado (schema.prisma)
├── public/             # Manifest PWA
├── server.js           # Backend robusto con validaciones y Prisma (891+ líneas)
├── Dockerfile          # Multi-stage optimizado con 'prisma generate'
├── docker-compose.yml  # Orquestación local
└── vite.config.ts      # Configuración de build
```

---

## ✅ **PROTOCOLO AURUM DETECTADO**

El código utiliza comentarios numéricos que parecen seguir una metodología interna:
- `148721091` - Protocolo de Materialización
- `520` - Protocolo de Abundancia
- `8888` - Protección de entorno limpio
- `419 488 71` - Protocolo de Crecimiento

---

## 🔐 **VARIABLES DE ENTORNO REQUERIDAS**

```env
# Database
DATABASE_URL=postgresql://...
DATABASE_PASSWORD=***

# Auth
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://...
JWT_SECRET=***

# APIs
API_KEY=*** (Google Gemini)
MP_ACCESS_TOKEN=*** (Mercado Pago)

# Redis
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=***
SMTP_PASS=***

# WhatsApp (WAHA API)
WAHA_URL=http://...
WAHA_OTP_SESSION=WHATSCLOUD
WAHA_API_KEY=***

# Web Push
VAPID_PUBLIC_KEY=***
VAPID_PRIVATE_KEY=***
VAPID_CONTACT=mailto:***

# Domain
DOMAIN_URL=https://citaplanner.ai
```

---

## 📊 **LÍNEAS DE CÓDIGO**

- **Backend (server.js)**: 813 líneas
- **Frontend**: ~200,000+ caracteres repartidos en 19 páginas
- **Servicios**: 6 archivos especializados
- **Componentes**: 14 archivos reutilizables

---

**Última actualización**: 2026-04-28 (v6.3 Aurum Nexus)  
**Estado**: ✅ En producción funcional (Analytics Hub & Live Data Bindings)
