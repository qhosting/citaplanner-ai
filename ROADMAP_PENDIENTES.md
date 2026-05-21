# Roadmap de Pendientes & Mejoras - CitaPlanner AI
## Historial de Versiones e Hitos de Ejecución

---

## 🏛️ **HISTORIAL DE HITOS COMPLETADOS**

### **Fase 1: Estabilización y Core (v5.0)**
- [x] **Arquitectura Monotenant Global Dedicada**
  - **Motivo**: Reducción de la complejidad de multi-tenant a favor de nodos dedicados altamente eficientes basados en `ORGANIZATION_ID` aislado por dominio.
  - **Impacto**: Mayor velocidad de consultas y estructura de base de datos relacional PostgreSQL atómica mediante Prisma ORM.

### **Fase 2: Visual & UX Premium (v6.0)**
- [x] **Branding Dinámico & Eliminación de Parpadeo**
  - **Motivo**: Carga inconsistente de configuraciones del cliente que causaba destellos visuales con el nombre base.
  - **Impacto**: Inyección directa y síncrona en `index.html` y sincronización con el contexto de React.
- [x] **Migración a Tailwind CSS v4**
  - **Motivo**: Modernización completa de la pila de estilos e integración de PostCSS 8 y `@tailwindcss/postcss`.
- [x] **Analytics Hub & Desktop Performance**
  - **Motivo**: Tableros de administración dependientes de mocks y vistas deficientes en pantallas grandes.
  - **Impacto**: Eliminación de datos simulados en `/analytics`. Conexión directa a Prisma para KPIs en tiempo real de facturación, citas, nuevos clientes y ocupación semanal.

### **Fase 3: Inteligencia & Integraciones (v6.8) - ¡FINALIZADA!**

- [x] **Nexus Stability Core (v6.4)**
  - **Motivo**: Necesidad de una vista densa y profesional para gestionar múltiples agendas simultáneamente en el negocio.
  - **Impacto**: Implementación del Grid semanal interactivo de 7 días, control de excepciones del personal, porcentaje dinámico de ocupación y feeds de suscripción iCalendar protegidos por token maestro.

- [x] **WAHA Live Test Messaging Suite & Diagnostics (v6.4.2)**
  - **Motivo**: Falta de visibilidad operativa sobre el estado de la comunicación de WhatsApp y problemas en las integraciones.
  - **Impacto**: Creación de la barra de diagnósticos dentro del panel de configuración. Monitoreo del estado de sesión WAHA en vivo y formulario de envío de mensajes de prueba inmediatos.

- [x] **Multichannel Marketing Template Engine (v6.5)**
  - **Motivo**: Requerimiento de estructurar campañas publicitarias dinámicas directamente desde el panel sin depender de redactores externos.
  - **Impacto**: Creación del gestor CRUD de plantillas de marketing multicanal (EMAIL, WHATSAPP, SMS). Integración con variables dinámicas de cliente y envío de campañas masivas segmentadas en vivo.

- [x] **Advanced SEO, GEO & Schema.org Local Business Hub (v6.6)**
  - **Motivo**: Optimizar la visibilidad orgánica de los portales de reserva locales y facilitar la localización de sucursales físicas.
  - **Impacto**: Creación de un inyector SEO reutilizable que genera cabeceras dinámicas y scripts JSON-LD estructurados para Schema.org (LocalBusiness). Generación automática de `robots.txt` y `sitemap.xml`. Integración de coordenadas GPS reales en la base de datos de sedes.

- [x] **WAHA Lead Auto-Capture Engine & Webhook (v6.7)**
  - **Motivo**: Pérdida de prospectos comerciales que escribían a las líneas de WhatsApp de los salones de belleza sin registrarse en la plataforma.
  - **Impacto**: Webhook activo en `/api/leads/webhook` que procesa los mensajes entrantes de números desconocidos en WAHA y los inserta de forma automática en el tablero de Leads de forma aislada por tenant. Conversión del Lead en cliente CRM con un solo clic.

- [x] **Maintenance Protocols Restoration & API Refactor (v6.8)**
  - **Motivo**: Falta de control sobre los procesos internos de limpieza y protocolos operativos diarios en las sucursales de estética.
  - **Impacto**: Desarrollo de endpoints robustos CRUD de tareas de mantenimiento. Algoritmo Round-Robin automatizado para distribuir equitativamente las tareas diarias entre el personal con turnos activos. Envío automatizado de recordatorios matutinos y alertas de finalización por WhatsApp al administrador del sistema.

### **Fase 4: QA, Sincronización y Automatización (v7.0) - ¡FINALIZADA!**
- [x] **Sincronización Bidireccional de Calendarios (Google & Apple)**
  - **Motivo**: Evitar conflictos de agenda cuando los profesionales modifican su calendario personal fuera de la aplicación.
  - **Impacto**: Webhook en `/api/calendar/google/webhook/:professionalId` con parseo incremental de `syncToken` y renovación programada automática de watch. Creación física de bloqueos `status: 'BLOCKED'` en la base de datos PostgreSQL en tiempo real y propagación bidireccional.
- [x] **IA Predictiva de Cancelaciones (Gemini No-Show AI Engine)**
  - **Motivo**: Reducir el porcentaje de pérdidas financieras debido a ausencias sin aviso previo.
  - **Impacto**: Integración con el SDK `@google/genai` (Gemini 1.5 Flash). Análisis predictivo que extrae historial del cliente de base de datos para estimar el riesgo y justificaciones de inasistencia, guardándolo físicamente en `Appointment.noShowRisk`.
- [x] **Suite de Pruebas de Calidad (Vitest + Playwright QA)**
  - **Motivo**: Asegurar la integridad operativa de los flujos de base de datos y la consistencia en el navegador antes de subir cambios a producción.
  - **Impacto**: Suite Vitest unificada en `/tests/server.test.js` y Playwright E2E en `/tests/e2e/booking.spec.ts` validando la carga del portal de reservas público, la consistencia de metadatos SEO y llamadas transaccionales reales.
- [x] **Módulo de Inventarios Avanzado con Pedidos de Compra Automáticos**
  - **Motivo**: Evitar rupturas de stock en productos e insumos de alta demanda técnica.
  - **Impacto**: Integración transaccional ACID (`prisma.$transaction`) al completar citas o registrar ventas en el POS. Despacho real de correos de reabastecimiento vía Nodemailer (SMTP) y/o alertas de WhatsApp WAHA al proveedor externo registrado cuando el stock es menor o igual a `minStock`.

---

## 🔮 **PLAN DE DESARROLLO FUTURO (SIN MOCKS)**

### **Fase 5: Expansión Global & Enterprise SaaS (v8.0)**
- [ ] **Internacionalización Nativa i18n**
  - **Motivo**: Escalabilidad del negocio hacia mercados angloparlantes y de habla portuguesa.
  - **Impacto**: Soporte multi-idioma seleccionable en el panel administrativo y en el widget del portal de reservas.
- [ ] **Multi-moneda y Pasarela de Stripe Global**
  - **Motivo**: Permitir cobros locales y suscripciones SaaS fuera de la cobertura de Mercado Pago en Latinoamérica y Europa.
  - **Impacto**: Detección geográfica del cliente, conversión dinámica de divisas y checkout nativo Stripe.
- [ ] **Facturación Electrónica Localizada (SAT y equivalentes)**
  - **Motivo**: Requerimiento fiscal indispensable para negocios en crecimiento en México, Colombia y Chile.
  - **Impacto**: Conexión con proveedores autorizados de certificación fiscal para facturar directamente los cierres de caja del POS.

---

**Última actualización**: 2026-05-21 (v7.0 QA, Sincronización y Automatización)  
**Estado de Planeación**: 📋 Backlog de Fase 5 estructurado de forma realista para la internacionalización y expansión enterprise del SaaS.
