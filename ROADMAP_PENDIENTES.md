# Roadmap de Pendientes y Mejoras Futuras

Este documento detalla las tareas pendientes, mejoras técnicas y características planificadas para llevar CitaPlanner AI al siguiente nivel.

## 🔴 Prioridad Alta (Corto Plazo)

### 1. Infraestructura y Base de Datos
- [x] **Configuración de DB en Producción:** Mejorada la robustez de `initDB` y soporte para fallback en entorno de desarrollo.
- [x] **Manejo de Errores DB:** Implementado listener de errores en el pool de conexiones.
- [x] **Integración con Redis:** Implementada capa de caché para endpoints de lectura (Productos, Servicios) con fallback automático.

### 2. Funcionalidad de WhatsApp (WAHA)
- [x] **Conexión Real con WAHA:** Implementado envío de mensajes de confirmación automáticos al crear cita vía `POST /api/appointments`.
- [x] **Webhooks de Recepción:** Implementado endpoint `/api/integrations/whatsapp/webhook` para procesar confirmaciones ("CONFIRMAR") y actualizar el estado.

### 3. Finalización de Módulos Mock
- [x] **Marketing Real:** Backend implementado (`POST /api/marketing/campaigns/send`) con soporte para Email (Nodemailer) y WhatsApp (WAHA), incluyendo segmentación básica de audiencia.
- [ ] **Simulación de Pagos:** El módulo POS registra transacciones pero no conecta con pasarelas de pago reales (Stripe/MercadoPago).

## 🟡 Prioridad Media (Mediano Plazo)

### 1. Mejoras en IA (Gemini)
- [ ] **Asistente de Voz Real:** Conectar el componente `VoiceAssistant` con la API de Speech-to-Text del navegador o de Google para permitir agendamiento por voz real.
- [ ] **Análisis Predictivo:** Usar el historial de citas para sugerir momentos de alta demanda o clientes en riesgo de fuga.

### 2. Experiencia de Usuario (UX)
- [x] **Notificaciones Push:** Implementado sistema de Web Push Notifications (backend VAPID + Service Worker) para alertas en tiempo real.
- [ ] **Tema Claro/Oscuro:** El sistema es "Dark Mode" por defecto (Aurum Luxury). Añadir soporte para tema claro si se requiere.

### 3. Portal del Cliente
- [x] **Auto-agendamiento:** Implementada página de reservas (`BookingPage`) con detección de huecos libres, exclusión de citas ocupadas y pre-llenado de datos para clientes logueados.

## 🟢 Prioridad Baja / Deseos (Largo Plazo)

### 1. Expansión de Negocio
- [x] **Multi-Tenant Real:** Implementada arquitectura multi-tenant con columna `organization_id` y middleware de aislamiento de queries.
- [x] **App Móvil (PWA):** Configurada Progressive Web App (Manifest + Service Worker) para instalación en dispositivos móviles.

### 2. Auditoría y Seguridad
- [ ] **Logs de Auditoría:** Registrar quién modificó qué cita y cuándo.
- [ ] **2FA:** Autenticación de dos factores para administradores.

---
**Nota:** Todas las contribuciones deben seguir el flujo de trabajo de Git establecido (Branch -> PR -> Main).
