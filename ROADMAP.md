# 📋 ROADMAP - CitaPlanner AI
## Estado Actual del Sistema (Aurum Nexus v7.0)

---

## 🏗️ **STACK TECNOLÓGICO REAL**

### **Frontend (SPA)**
- [x] **React 19.0.0** - Framework de interfaz declarativo y reactivo.
- [x] **TypeScript 5.8.2** - Tipado estático robusto a nivel de componentes e interfaces de datos.
- [x] **Vite 6.4.1** - Herramienta de compilación ultrarrápida y servidor de desarrollo.
- [x] **Tailwind CSS 4.2.1** - Motor de estilos nativo CSS-first con soporte `@theme` y PostCSS 8.
- [x] **React Router DOM 6.28.0** - Sistema dinámico de enrutamiento SPA con protección de rutas por roles.
- [x] **React Hook Form 7.54.1** & **Zod 3.24.1** - Validación atómica de formularios en tiempo real.
- [x] **TanStack Query 5.62.7** - Gestión avanzada del estado y caché de servidor con tiempos de expiración y reintentos selectivos.
- [x] **Lucide React 0.475.0** - Sistema premium de iconos vectoriales consistentes.
- [x] **Sonner 1.7.0** - Sistema estético de notificaciones toast flotantes.
- [x] **Socket.io Client 4.8.3** - Comunicación bidireccional en tiempo real para actualización de tableros.

### **Backend (Express)**
- [x] **Node.js 20** (Alpine) - Entorno de ejecución en contenedor seguro.
- [x] **Express 5.2.1** - Servidor HTTP robusto con middlewares personalizados de control de tenants y seguridad.
- [x] **PostgreSQL 15** - Base de datos relacional transaccional para datos estructurados de clientes, citas e inventarios.
- [x] **Prisma ORM 6.19.2** - Mapeador objeto-relacional tipado con sistema de autodespliegues y transacciones ACID nativas.
- [x] **Redis 5.10.0** - Caché en memoria para optimizar lecturas frecuentes y sesiones compartidas.
- [x] **Bcryptjs 3.0.3** - Encriptación asimétrica irreversible para el resguardo seguro de credenciales de usuario.
- [x] **Express Rate Limit 8.2.1** - Protección activa contra ataques DDoS y fuerza bruta mediante limitación de solicitudes (aplicado en login y endpoints críticos).
- [x] **Helmet 8.1.0** - Hardening de cabeceras HTTP de seguridad.
- [x] **Socket.io 4.8.3** - Orquestación de eventos WebSocket en tiempo real en la misma interfaz de servidor.

### **Integraciones Estratégicas**
- [x] **Google GenAI SDK 1.42.0** - Asistencia e interpretación inteligente de lenguaje natural (Gemini 3 Flash Preview & Gemini 1.5 Pro).
- [x] **Google APIs (googleapis) 170.1.0** - Sincronización saliente con calendarios profesionales.
- [x] **Mercado Pago 2.12.0** & **OpenPay 1.0.5** - Pasarelas de procesamiento transaccional e integraciones recurrentes de planes SaaS.
- [x] **WAHA API (WhatsApp HTTP)** - Notificaciones salientes en vivo de citas y recordatorios masivos programados.
- [x] **Nodemailer 7.0.13** - Motor de correo electrónico transaccional SMTP.
- [x] **Web Push 3.6.7** - Notificaciones nativas a dispositivos móviles e instalables PWA.

### **DevOps, Resiliencia & QA Framework**
- [x] **Docker Compose 3.8** - Orquestación local multicontenedor aislada en red interna.
- [x] **Docker Multi-Stage** - Construcciones eficientes separando compilación de producción y tiempo de ejecución.
- [x] **Node Cron 4.2.1** - Distribución y ejecución automatizada de trabajadores de recordatorios, cumpleaños y tareas.
- [x] **Archiver 7.0.1** - Compresión automatizada ZIP para respaldos estructurados del sistema.
- [x] **Vitest 4.0.18** - Framework de pruebas unitarias e integración en entorno de ejecución ultra rápido.
- [x] **Playwright 1.60.0** - Suite de pruebas E2E interactiva para validación multi-navegador en sandbox real.

---

## 🎯 **FUNCIONALIDADES IMPLEMENTADAS EN EL NÚCLEO**

### **1. Módulo de Autenticación & Control de Roles**
- Sistema de login seguro basado en JSON Web Tokens (JWT) y cookies locales.
- **Refresh Token Rotation**: Rotación automática de tokens de refresco tras expiración de sesión normal (8 horas de sesión activa, 7 días de token de refresco en base de datos).
- Recuperación de contraseñas mediante tokens seguros por correo electrónico con expiración de 1 hora.
- Bypass de desarrollo seguro para entornos locales.
- **Roles Estrictos**: GOD_MODE (Super Administrador), ADMIN, STUDIO_OWNER, STAFF / PROFESSIONAL, y CLIENT / MEMBER.

### **2. Panel de Control & Analytics Hub (100% Conectado a BD)**
- **KPIs en Tiempo Real**: Eliminación completa de mocks en `/analytics`.
- Conexión directa a PostgreSQL mediante Prisma para calcular: Ingresos Totales (basados en ventas procesadas), Citas Completadas, Nuevos Clientes del mes y porcentaje dinámico de Ocupación.
- **Gráficos Financieros**: Historial real de flujo de ingresos de los últimos 7 días.
- **Mix de Servicios**: Distribución porcentual interactiva de las especialidades preferidas por los clientes.
- **Top Ventas**: Ranking en tiempo real de los 5 productos retail más comercializados en el negocio.

### **3. CRM de Clientes (Directorio y Portal de Sesión)**
- Registro detallado de datos personales, teléfono, correo e historial completo.
- **Portal del Cliente**: Espacio interactivo donde el cliente puede actualizar su historial clínico (tipo de piel, alergias, condiciones médicas) y firmar digitalmente el formulario de consentimiento de tratamientos de belleza.
- Preferencias personalizables de notificaciones (WhatsApp/Email).

### **4. Matriz Maestra de Agenda (Schedules Matrix)**
- Grid densa e interactiva de 7 días para gestionar las agendas de múltiples profesionales en paralelo.
- Visualización de porcentaje de ocupación semanal en el cabezal inteligente.
- Control de excepciones de jornada (días de descanso, bloqueos de vacaciones).
- **iCal Calendar Feed**: Generación dinámica de feeds iCalendar en formato `.ics` protegidos por tokens únicos para importación directa en Apple Calendar, Google Calendar y Microsoft Outlook.

### **5. Punto de Venta (POS) e Integración de Pagos**
- Catálogo interactivo de productos retail y servicios.
- Carrito transaccional unificado.
- Generación de preferencias de pago e inicio de checkout dinámico con Mercado Pago.
- Almacenamiento seguro del registro e historial de ventas en base de datos PostgreSQL.

### **6. Marketing Automatizado & Campaign Template Engine**
- Workspace avanzado de plantillas de marketing multicanal (EMAIL, WHATSAPP, SMS) con soporte CRUD.
- Envío segmentado de campañas automáticas según etiquetas o segmentos específicos.
- Automatizaciones programadas (Workers por Cron):
  1. Recordatorio automático de cita 24 horas antes vía WhatsApp.
  2. Envío automatizado de instrucciones de cuidado (aftercare) 3 horas después del servicio completado.
  3. Felicitaciones y promociones automatizadas por cumpleaños (6:00 AM diariamente).

### **7. SEO, GEO & Schema.org Local Business Hub**
- Inyección automatizada de Schema.org JSON-LD local business estructurado en el builder de páginas.
- Posicionamiento dinámico mediante meta etiquetas SEO personalizadas por el administrador.
- Geocodificación interactiva con coordenadas geográficas reales (latitud/longitud) para mapas de clientes.
- Generación dinámica de `robots.txt` y `sitemap.xml`.

### **8. Capturador Automático de Prospectos (WhatsApp Lead Auto-Capture)**
- Endpoint de Webhook exclusivo integrado con WhatsApp WAHA.
- Captura instantánea de mensajes recibidos de clientes desconocidos en la línea comercial.
- Inserción automática y estructurada en el pipeline de Leads (LeadsPage) con valoración estimada e interés.
- Conversión de Leads a Clientes registrados del CRM con un solo clic, preservando el historial de notas.

### **9. Suite de Diagnósticos e Interconectividad (Bridge Hub)**
- Panel interactivo en configuración para verificar el estado de conexión del motor de WhatsApp WAHA.
- Suite de pruebas de envío de mensajes en tiempo real para verificar la entrega a teléfonos de prueba.
- **Aurum Bridge**: Handshake seguro integrado mediante claves UUID rotativas y verificación de estado contra los nodos corporativos centrales de la organización.

### **10. Distribuidor de Tareas (Maintenance Manager)**
- Creación de tareas operativas y mantenimiento por día de la semana.
- Algoritmo de distribución equitativa (Round-Robin) a los profesionales que tienen turnos el día correspondiente.
- Notificaciones personalizadas automáticas a los profesionales al inicio de su jornada laboral vía WhatsApp.
- Alerta instantánea al administrador cuando un profesional marca su tarea como "Completada" en el panel.

### **11. Sincronización Bidireccional de Google Calendar (Real-Time Webhook)**
- Webhook en `/api/calendar/google/webhook/:professionalId` para la recepción de push notifications de eventos de Google.
- Parseo incremental eficiente utilizando tokens `syncToken` de Google y recuperación automática ante expiración (410 Gone).
- Creación automática de ranuras bloqueadas (`status: 'BLOCKED'`) en la base de datos PostgreSQL y eliminación recíproca.
- Worker de seguridad recurrente que realiza barridos incrementales periódicos y renovación de suscripciones watch automáticamente.

### **12. IA Predictiva de Cancelaciones (Gemini No-Show Engine)**
- Motor de inteligencia artificial integrado nativamente a través del SDK oficial `@google/genai` (Gemini 1.5 Flash).
- Generación de contexto dinámico real extrayendo del cliente: tasa histórica de asistencia, antelación de reservas, días y horas de las citas.
- Cálculo de riesgo de inasistencia porcentual almacenado físicamente en base de datos (`Appointment.noShowRisk`).
- Justificaciones analíticas ("No-Show Reasons") y planes sugeridos de contención presentados en el panel administrativo sin mocks.

### **13. Inventario Avanzado & Pedidos de Compra Automáticos**
- Control y devaluación del stock físico de insumos y productos retail en transacciones ACID transaccionales (`prisma.$transaction`) al facturar por POS o completar citas.
- Auditoría automatizada de movimientos de stock con registros de tipo `IN`/`OUT` en `InventoryMovement` para trazabilidad completa.
- Despacho real en vivo de correos Nodemailer SMTP y/o alertas de WhatsApp WAHA automáticas al proveedor externo registrado tan pronto como el stock cae bajo `minStock`.

### **14. QA Integration & E2E Validation Suite**
- Suite unitaria e integración robusta en `/tests/server.test.js` probando todas las APIs REST transaccionales.
- Suite E2E interactiva Playwright en `/tests/e2e/booking.spec.ts` validando SEO tags reales y endpoints de salud desde un navegador headless Chromium real.

---

## 🐳 **CONTENEDORES DOCKER**

### **citaplanner-db** (PostgreSQL 15-alpine)
- [x] Aislamiento de red interna: `citaplanner_internal`
- [x] Almacenamiento persistente en volumen: `postgres_data`

### **citaplanner-app** (Node 20-alpine)
- [x] Construcción optimizada multi-etapa.
- [x] Generación del cliente de Prisma integrado en tiempo de compilación.
- [x] Servidor unificado en el puerto **3000** sirviendo la compilación optimizada del frontend y la API REST en el mismo proceso.

---

## 📦 **ESTRUCTURA REAL DEL PROYECTO**

```
citaplanner-ai/
├── pages/              # 24 Páginas SPA React totalmente conectadas (POS, Analytics, Leads, etc.)
├── components/         # 23 Componentes interactivos reutilizables (SEO, Dossier, Widgets, etc.)
├── services/           # 7 Servicios avanzados (API Axios, Socket, Gemini, Cloudflare, etc.)
├── context/            # AuthContext (JWT) y ThemeContext (Light/Dark Mode)
├── utils/              # Utilidades auxiliares (webPush, VAPID)
├── prisma/             # Esquema mapeado estructurado de base de datos (schema.prisma)
├── public/             # PWA assets, robots.txt estático y sitemap base
├── scripts/            # Scripts operacionales y de inicialización de datos base (Seeding)
└── server.js           # Backend unificado robusto de 3,506 líneas de código (REST, Cron, WebSockets)
```

---

**Última actualización**: 2026-05-20 (v7.0 QA, Sincronización y Automatización)  
**Estado**: 🚀 Totalmente operativo y desplegado. Base de datos robusta, API de producción, integraciones activas, PWA instalable y suite completa de automatizaciones de negocio en tiempo real. Sin dependencias de datos simulados (mocks) en flujos de producción.
