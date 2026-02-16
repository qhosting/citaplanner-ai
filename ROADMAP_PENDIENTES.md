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
  - **Impacto**: Habilita estructura SaaS (negocio2.citaplanner.com vs negocio2.com)
  - **Estimación**: Completado (Schema actualizado)

- [ ] **Recuperación de contraseña vía email**
  - **Motivo**: Funcionalidad básica ausente
  - **Impacto**: UX deficiente
  - **Estimación**: 4 horas

- [ ] **Sistema de notificaciones en tiempo real (WebSockets)**
  - **Motivo**: Actualmente solo hay push notifications
  - **Impacto**: Datos desactualizados en dashboards
  - **Estimación**: 12 horas

- [ ] **Exportación avanzada de reportes (PDF/Excel)**
  - **Motivo**: Analytics solo tiene vista en pantalla
  - **Impacto**: Clientes empresariales lo requieren
  - **Estimación**: 8 horas

- [ ] **Sistema de pagos recurrentes (suscripciones)**
  - **Motivo**: Solo hay pagos únicos con Mercado Pago
  - **Impacto**: Modelo de negocio SaaS incompleto
  - **Estimación**: 16 horas

- [ ] **Calendario sincronizado con Google Calendar**
  - **Motivo**: Ya hay `googleapis` instalado pero no integrado
  - **Impaclo**: Productividad de profesionales limitada
  - **Estimación**: 10 horas

### **🧪 Testing & QA**
- [ ] **Crear suite de tests unitarios**
  - **Motivo**: 0% de cobertura de tests
  - **Impacto**: Regresiones no detectadas
  - **Estimación**: 20 horas (Jest + React Testing Library)

- [ ] **Tests de integración para endpoints críticos**
  - **Motivo**: No hay validación automatizada de API
  - **Impacto**: Bugs en producción frecuentes
  - **Estimación**: 16 horas (Supertest)

- [ ] **Tests E2E para flujos críticos**
  - **Motivo**: Validar experiencia de usuario completa
  - **Impacto**: UX inconsistente
  - **Estimación**: 12 horas (Playwright/Cypress)

### **🎨 UX/UI**
- [x] **Modo oscuro/claro persistente y rediseño visual Bugambilia**
  - **Motivo**: Mejora accesibilidad y estética institucional (Aurum Pro)
  - **Impacto**: Completado (CSS variables + Bugambilia integration)
  - **Estimación**: Completado

- [ ] **Diseño responsive completo**
  - **Motivo**: Verificar que todas las páginas funcionen en móvil
  - **Impacto**: Medio (app ya es PWA)
  - **Estimación**: 8 horas

- [ ] **Internacionalización (i18n)**
  - **Motivo**: Sistema optimizado para español, pero sin soporte multiidioma
  - **Impacto**: Limitación de mercado
  - **Estimación**: 12 horas

---

## 🟡 **PRIORIDAD MEDIA (BAJA)**

### **🧹 Deuda Técnica**
- [ ] **Refactorizar `server.js` (813 líneas monolíticas)**
  - **Motivo**: Violación del principio de responsabilidad única
  - **Impacto**: Difícil mantenimiento y escalabilidad
  - **Estimación**: 16 horas (dividir en controllers/routes/services)

- [ ] **Separar configuración de variables de entorno**
  - **Motivo**: Muchos valores hardcoded o con defaults inseguros
  - **Impacto**: Riesgo de seguridad en deploy
  - **Estimación**: 4 horas

- [ ] **Documentar API con Swagger/OpenAPI**
  - **Motivo**: No hay documentación de endpoints
  - **Impacto**: Dificulta integración de terceros
  - **Estimación**: 8 horas

- [ ] **Implementar arquitectura hexagonal/clean**
  - **Motivo**: Código fuertemente acoplado a Express/PostgreSQL
  - **Impacto**: Imposible migrar a otros frameworks/DBs
  - **Estimación**: 40 horas (refactor completo)

- [ ] **Optimizar bundle size del frontend**
  - **Motivo**: No se observa code-splitting o lazy loading
  - **Impacto**: Performance (LCP/FCP)
  - **Estimación**: 6 horas

### **📚 Documentación**
- [ ] **Crear guía de contribución (CONTRIBUTING.md)**
  - **Motivo**: Facilitar onboarding de nuevos desarrolladores
  - **Impacto**: Bajo
  - **Estimación**: 2 horas

- [ ] **Documentar "Protocolos Aurum" en código**
  - **Motivo**: Números místicos (148721091, 520, etc.) sin explicación
  - **Impacto**: Bajo (posible metodología interna)
  - **Estimación**: 1 hora

- [ ] **Crear diagrama de arquitectura (C4 Model)**
  - **Motivo**: Facilitar comprensión del sistema
  - **Impacto**: Medio
  - **Estimación**: 4 horas

### **🚀 Performance**
- [ ] **Implementar CDN para assets estáticos**
  - **Motivo**: Ya hay `cloudflare.js` pero no configurado
  - **Impacto**: Latencia global
  - **Estimación**: 4 horas

- [ ] **Configurar compresión Gzip/Brotli en Nginx**
  - **Motivo**: No hay reverse proxy configurado
  - **Impacto**: Ancho de banda desperdiciado
  - **Estimación**: 2 horas

- [ ] **Indexar tablas críticas en PostgreSQL**
  - **Motivo**: Queries sin análisis de performance
  - **Impacto**: Latencia en dashboards con muchos datos
  - **Estimación**: 4 horas

---

## 🔮 **FEATURES FUTURAS (BACKLOG)**

- [ ] **Integración con Stripe para pagos internacionales**
- [ ] **Sistema de fidelización/puntos para clientes**
- [ ] **App móvil nativa (React Native/Flutter)**
- [ ] **IA predictiva de demanda y optimización de horarios**
- [ ] **Videollamadas integradas (Jitsi/Zoom SDK)**
- [ ] **Marketplace de servicios (multi-negocio)**
- [ ] **Análisis de sentimiento de clientes (NLP)**

---

## 📊 **RESUMEN EJECUTIVO**

| Prioridad | Cantidad de Tareas | Estimación Total |
|-----------|-------------------|------------------|
| 🔴 CRÍTICA | 4 tareas | ~22 horas |
| 🟠 ALTA | 12 tareas | ~116 horas |
| 🟡 MEDIA | 11 tareas | ~91 horas |
| **TOTAL** | **27 tareas** | **~229 horas** |

---

## 🎯 **RUTA CRÍTICA RECOMENDADA**

1. **Semana 1-2**: Seguridad (encriptación, SQL injection, rate limiting)
2. **Semana 3-4**: Migraciones a Prisma + Tests básicos
3. **Semana 5-6**: Infraestructura (SSL, monitoreo, Google Cloud)
4. **Semana 7+**: Features de producción + Refactoring

---

**Última actualización**: 2026-02-03 (v5.1 Aurum Nexus)  
**Estado**: 🚀 Sistema robusto y funcional. Login desbloqueado y seguro.
