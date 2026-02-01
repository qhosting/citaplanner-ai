# Roadmap de Pendientes y Mejoras Futuras

Este documento detalla las tareas pendientes, mejoras técnicas y características planificadas para llevar CitaPlanner AI al siguiente nivel.

## 🔴 Prioridad Alta (SaaS Automation)

### 1. Provisionamiento Automático
- [ ] **Stripe Subscription Webhooks:** Conectar eventos de Stripe (checkout.session.completed) para crear automáticamente nuevos tenants en el "Hub Maestro".
- [ ] **Gestión de DNS:** Automatizar la creación de subdominios (via Cloudflare API) cuando un cliente se registra.

### 2. Panel SuperAdmin (God Mode)
- [ ] **Dashboard Maestro:** Vista para ver todos los tenants activos, ingresos recurrentes (MRR) y estado del sistema.
- [ ] **User Masquerade:** Capacidad para "iniciar sesión como" un dueño de negocio para soporte técnico.

## 🟡 Prioridad Media (Experiencia)

### 1. Mejoras en IA (Gemini)
- [ ] **Asistente de Voz Real:** Conectar el componente `VoiceAssistant` con la API de Speech-to-Text del navegador o de Google para permitir agendamiento por voz real.
- [ ] **Análisis Predictivo:** Usar el historial de citas para sugerir momentos de alta demanda o clientes en riesgo de fuga.

### 2. Auditoría y Seguridad
- [ ] **Logs de Auditoría:** Registrar quién modificó qué cita y cuándo.
- [ ] **2FA:** Autenticación de dos factores para administradores.

---

## ✅ Completado (Historial)

### Infraestructura y Core
- [x] **Configuración de DB en Producción:** Mejorada la robustez de `initDB` y soporte para fallback en entorno de desarrollo.
- [x] **Manejo de Errores DB:** Implementado listener de errores en el pool de conexiones.
- [x] **Integración con Redis:** Implementada capa de caché para endpoints de lectura (Productos, Servicios) con fallback automático.
- [x] **Multi-Tenant Real:** Implementada arquitectura multi-tenant con columna `organization_id` y middleware de aislamiento de queries.
- [x] **App Móvil (PWA):** Configurada Progressive Web App (Manifest + Service Worker) para instalación en dispositivos móviles.

### Integraciones
- [x] **Conexión Real con WAHA:** Implementado envío de mensajes de confirmación automáticos al crear cita vía `POST /api/appointments`.
- [x] **Webhooks de Recepción:** Implementado endpoint `/api/integrations/whatsapp/webhook` para procesar confirmaciones ("CONFIRMAR") y actualizar el estado.
- [x] **Marketing Real:** Backend implementado (`POST /api/marketing/campaigns/send`) con soporte para Email (Nodemailer) y WhatsApp (WAHA).
- [x] **Simulación de Pagos:** Integrada pasarela **Mercado Pago** en el POS (backend + frontend).
- [x] **Notificaciones Push:** Implementado sistema de Web Push Notifications (backend VAPID + Service Worker).

### Portal Cliente
- [x] **Auto-agendamiento:** Implementada página de reservas (`BookingPage`) con detección de huecos libres y pre-llenado de datos.

---
**Nota:** Todas las contribuciones deben seguir el flujo de trabajo de Git establecido (Branch -> PR -> Main).
