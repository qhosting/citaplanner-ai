# Roadmap del Sistema CitaPlanner AI

## 🌟 Visión del Proyecto
CitaPlanner AI (Aurum Edition) es una plataforma de gestión empresarial de "Lujo Simplificado" diseñada para negocios de belleza, bienestar y servicios profesionales. Su objetivo es unificar la agenda, la gestión de clientes y la inteligencia artificial en una interfaz elegante y de alto rendimiento.

## 🏗️ Arquitectura Actual
El sistema opera bajo un modelo **Monolito Modular Moderno**:
*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
*   **Backend:** Node.js (Express 5), PostgreSQL (pg).
*   **Infraestructura:** Contenerizable (Docker), compatible con Google Project IDX / AI Studio.

## 📦 Módulos Principales (Implementados)

### 1. Núcleo de Gestión (Core)
*   **Autenticación Robusta:** Sistema de roles (ADMIN, PROFESSIONAL, CLIENT) con protección de rutas.
*   **Gestión de Sedes (Multi-branch):** Soporte para múltiples sucursales en la base de datos.
*   **Panel de Control (Dashboard):** Vista centralizada con métricas en tiempo real y accesos rápidos.

### 2. Agenda Inteligente
*   **Smart Scheduler (Gemini AI):** Interpretación de lenguaje natural para crear citas (ej: "Cita con Ana mañana a las 5pm").
*   **Vista de Calendario:** Visualización de citas por profesional y estado.
*   **Detección de Conflictos:** Validación básica de horarios ocupados.

### 3. Directorio de Entidades
*   **Clientes:** Perfiles detallados, historial y preferencias.
*   **Profesionales:** Gestión de horarios, excepciones y especialidades.
*   **Servicios:** Catálogo de servicios con precios y duraciones.
*   **Inventario:** Control básico de productos y stock.

### 4. Marketing y Expansión
*   **Landing Page Configurable:** Motor para generar la página web pública del negocio desde la configuración interna.
*   **Módulo de Marketing:** Interfaz para campañas (Email/WhatsApp) y automatizaciones.

### 5. Integraciones
*   **Logs de Integración:** Registro de eventos externos (Webhooks, AI, etc.).
*   **Modo Desarrollo:** Bypass de autenticación para entornos sin base de datos (`dev` / `dev`).

## 🚀 Flujo de Trabajo Recomendado
1.  **Inicio:** El administrador configura servicios y profesionales.
2.  **Operación:** El recepcionista o la IA agendan citas.
3.  **Seguimiento:** El sistema registra transacciones y cambios de estado.
4.  **Análisis:** El dueño revisa las métricas de negocio en el Dashboard.
