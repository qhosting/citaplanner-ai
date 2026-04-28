# Roadmap de Pendientes & Mejoras - CitaPlanner AI

## Historial de Versiones y Hitos

### **Fase 1: Estabilización y Core (v5.0)**
- [x] **Arquitectura Monotenant Global**
  - **Motivo**: Eliminar complejidad de multi-tenant innecesaria para despliegues dedicados.
  - **Impacto**: Completado (Single organization model).
  - **Estimación**: Completado

### **Fase 2: Visual & UX Premium (v6.0)**
- [x] **Branding Dinámico & Eliminación de Flash**
  - **Motivo**: Aparecía "Citaplanner" brevemente antes de cargar settings.
  - **Impacto**: Completado (Inyección dinámica en index.html y React init).
  - **Estimación**: Completado

- [x] **Migración a Tailwind CSS v4**
  - **Motivo**: Modernización del motor de estilos y mejora de performance.
  - **Impacto**: Completado (Engine v6.2 con soporte @theme y PostCSS 8).
  - **Estimación**: Completado

- [x] **Analytics Hub: Data Bindings & Desktop Optimization**
  - **Motivo**: Analytics usaba mocks y visualización pobre en desktop.
  - **Impacto**: Completado (Live KPIs, Revenue Charts, Top Products & AI DAFO).
  - **Estimación**: Completado

### **Fase 3: Inteligencia & Integraciones (v6.6)**
- [x] **SEO & GEO Advanced Optimization**
  - **Motivo**: Necesidad de visibilidad en Google y buscadores locales.
  - **Impacto**: Completado (JSON-LD LocalBusiness, robots.txt, sitemap.xml, GEO tags e inyección dinámica de meta-tags).
  - **Estimación**: Completado

- [x] **Marketing Template Engine (Multichannel)**
  - **Motivo**: Necesidad de una vista densa y profesional para gestionar múltiples agendas simultáneamente.
  - **Impacto**: Completado (Grid 7-días, Intelligence Header, real-time occupancy).
  - **Estimación**: Completado

- [x] **WAHA Security & Diagnostics Hub**
  - **Motivo**: Asegurar la comunicación por WhatsApp y permitir diagnósticos en vivo.
  - **Impacto**: Completado (API Key Auth, Status Monitor, Live Test Messaging).
  - **Estimación**: Completado

- [x] **Nexus Stability (v6.4)**
  - [x] Gestión de Sesiones WAHA (Master OTP Session)
  - [x] Monitor de Estado de Integraciones (Settings UI)
  - [x] Prueba de Envío de Mensaje (Live Diagnostics)
  - [x] Matriz Maestra de Especialistas (Schedules Matrix)
  - [x] Intelligence Header (Occupancy Analytics)

---

## Próximos Pasos (Backlog)

### **Fase 4: Transacciones & Backend (v7.0)**
- [ ] **ACID Transactions en Reservas**
  - **Motivo**: Prevenir sobreventas en entornos de alta concurrencia.
  - **Impacto**: Alta criticidad para escalabilidad.
- [ ] **Módulo de Inventarios Avanzado**
  - **Motivo**: Controlar stock de productos vinculados a servicios (ej. tintes, pestañas).
- [ ] **IA Predictiva de Cancelaciones**
  - **Motivo**: Detectar patrones de usuarios que suelen faltar para enviar recordatorios agresivos.

**Última actualización**: 2026-04-28 (v6.4 Nexus Stability)
**Estado**: 🚀 Sistema inteligente y estable. Analytics Hub operativo con datos reales y optimización desktop premium. WhatsApp Diagnostic Suite activo.
