# 🚨 ROADMAP PENDIENTES - CitaPlanner AI
## Tareas Críticas, Features Faltantes & Deuda Técnica

---

## 🔴 **PRIORIDAD CRÍTICA (ALTA)**

### **🔐 Seguridad & Compliance**
- [x] **Implementar rate limiting** en endpoints de autenticación
- [x] **Encriptar contraseñas con bcrypt/argon2**
- [x] **Validar y sanitizar inputs del usuario** (Zod Schemas implementados)
- [ ] **Implementar refresh tokens**
  - **Motivo**: JWT expiración fija (8h) sin renovación
  - **Impacto**: UX deficiente (sesiones cortas)
  - **Estimación**: 6 horas

### **🗄️ Base de Datos**
- [x] **Migrar de SQL raw a un ORM (Prisma)**
- [x] **Crear sistema de migraciones versionado** (Aurum Nexus v5.1 integrado)
- [ ] **Implementar transacciones ACID en operaciones críticas**
  - **Motivo**: Bookings + Pagos deben ser atómicos
  - **Impacto**: Inconsistencias en la base de datos
  - **Estimación**: 4 horas

### **🔧 Infraestructura**
- [ ] **Completar configuración de Google Cloud**
  - **Motivo**: Archivo `GOOGLE_CLOUD_SETUP.md` presente pero no validado
  - **Impacto**: Funcionalidades dependientes de GCP no operativas
  - **Estimación**: 6 horas + costos de infra

- [ ] **Configurar SSL/TLS en producción**
  - **Motivo**: No se observa configuración de HTTPS en Dockerfile/Compose
  - **Impacto**: Datos sensibles expuestos en tránsito
  - **Estimación**: 3 horas (con reverse proxy)

- [ ] **Implementar monitoreo y logs centralizados**
  - **Motivo**: No hay sistema de observabilidad (APM, logging)
  - **Impacto**: Imposible debuggear en producción
  - **Estimación**: 8 horas (Grafana/Loki stack)

---

## 🟠 **PRIORIDAD ALTA (MEDIA)**

### **📱 Features de Producción Faltantes**
- [x] **Preparar DB para SaaS Multi-tenant (Custom Domains)**
  - **Motivo**: Requerimiento clave del modelo de negocio (CEO -> Negocios)
  - **Impacto**: Completado (Web Builder v2: Galería + Servicios dinámicos + Shula Dark Theme)
  - **Estimación**: Completado

- [x] **Mejoras UX / UI**
  - **Motivo**: Refinamiento de la experiencia de usuario
  - **Impacto**: Fix Modal Clientes (Z-Index), Web Builder Preview Real-time
  - **Estimación**: Completado

- [ ] **Recuperación de contraseña vía email**
  - **Motivo**: Funcionalidad básica ausente
  - **Impacto**: UX deficiente
  - **Estimación**: 4 horas

- [x] **Web Builder: Carga de Datos Default (Shula Studio)**
  - **Motivo**: Plantilla vacía al iniciar
  - **Impacto**: Completado (Pre-filled Shula Template)
  - **Estimación**: Completado

- [x] **Fix: Módulo Configuración**
  - **Motivo**: Reporte de fallo en carga
  - **Impacto**: Completado (Resolved Auth & Defaults)
  - **Estimación**: Completado

- [x] **Public Booking: Contexto Multi-tenant**
  - **Motivo**: `/book` carga datos genéricos o de demo
  - **Impacto**: Completado (Dynamic Styling, Logo & Address)
  - **Estimación**: Completado

- [x] **Clientes: Importación Masiva & Exportación**
  - **Motivo**: Gestión de bases de datos grandes
  - **Impacto**: Completado (CSV Import/Export)
  - **Estimación**: Completado

- [x] **Nexus: Plan Manager & Subscription Override**
  - **Motivo**: Nexus no tenía UI para crear planes ni gestionar suscripciones manualmente
  - **Impacto**: Completado (CRUD Plans, Trial Days, Status Override, Billing Log)
  - **Estimación**: Completado

- [x] **Landing Page: Multi-Tenant Dinámico por Web Builder**
  - **Motivo**: Todos los tenants mostraban el mismo landing con colores y textos hardcodeados
  - **Impacto**: Completado (Colores, branding, servicios, galería y contacto dinámicos por tenant)
  - **Estimación**: Completado

**Última actualización**: 2026-02-16 (v5.8 Dynamic Tenant Landing)
**Estado**: 🚀 Sistema robusto. Enfocados en Polish Visual y Estabilidad de Módulos.
