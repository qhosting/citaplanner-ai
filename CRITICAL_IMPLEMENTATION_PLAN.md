# 🚨 Plan de Implementación Crítica - CitaPlanner AI

Este documento detalla la estrategia paso a paso para resolver las vulnerabilidades críticas de seguridad, la deuda técnica de base de datos y la falta de infraestructura de producción detectadas en el análisis del código.

---

## 📅 Fase 1: Seguridad y Correcciones Bloqueantes (Estimado: 1-2 días)

**Objetivo**: Detener vulnerabilidades activas y asegurar que el servidor arranque correctamente.

### 1.1 Corrección de "Server Startup" (🐛 CRÍTICO)
- **Problema**: `server.js` no tiene `app.listen()`. El servidor nunca inicia.
- **Acción**: 
  - Agregar `app.listen(PORT, ...)` al final de `server.js` después de `initDB()`.
- **Verificación**: El servidor debe responder en puerto 3000.

### 1.2 Hardening de Autenticación
- **Problema**: Contraseñas en texto plano (líneas 209, 363, 387 de `server.js`).
- **Acción**:
  - Instalar `bcryptjs`: `npm install bcryptjs`
  - Modificar creación de usuario para hashear password.
  - Modificar `/api/login` para usar `bcrypt.compare()`.
  - Crear script para migrar usuarios existentes (reset de passwords necesario si están en plano).

### 1.3 Protección de API
- **Problema**: Sin Rate Limiting, vulnerable a fuerza bruta.
- **Acción**:
  - Instalar `express-rate-limit` y `helmet`.
  - Configurar middleware:
    ```javascript
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
    app.use('/api/', limiter);
    app.use(helmet());
    ```

---

## 📅 Fase 2: Modernización de Base de Datos (Estimado: 2-3 días)

**Objetivo**: Migrar de SQL Strings frágiles a un ORM robusto y tipado.

### 2.1 Configuración de Prisma ORM
- **Acción**:
  - `npm install prisma @prisma/client` & `npx prisma init`
  - Definir `prisma/schema.prisma` replicando el esquema actual:
    - Modelos: `Tenant`, `User`, `Professional`, `Service`, `Appointment`, `Branch` (Falta tabla), `Product`.
  - **Corrección**: Asegurar que modelo `Branch` esté definido (actualmente falta el `CREATE TABLE` pero sí hay `ALTER TABLE` y queries).

### 2.2 Reescritura de Capa de Datos
- **Acción**:
  - Reemplazar `initDB()` manual con migraciones de Prisma.
  - Refactorizar endpoints en `server.js` para usar `prisma.user.findUnique()`, etc.
  - Eliminar dependencia de `pg` y SQL strings propensos a inyección si no se sanitizan bien.

---

## 📅 Fase 3: Infraestructura de Producción (Estimado: 2 días)

**Objetivo**: Habilitar SSL y monitoreo real.

### 3.1 Docker Composition V2
- **Acción**:
  - Agregar servicio **Nginx** o **Caddy** en `docker-compose.yml` como Reverse Proxy.
  - Exponer puerto 80/443 en el proxy, cerrar puerto 3000 directo de la app.

### 3.2 SSL Automático
- **Acción**:
  - Configurar Let's Encrypt mediante Caddy (automático) o Certbot + Nginx.
  - Asegurar que `NEXTAUTH_URL` apunte al dominio HTTPS.

### 3.3 Validaciones Previas al Despliegue
- **Acción**:
  - Ejecutar `npm run build` localmente para validar frontend.
  - Verificar variables de entorno en servidor (evitar hardcoded secrets en `server.js` lines 21, 43, etc).

---

## 📝 Resumen de Dependencias Nuevas
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "@prisma/client": "^5.10.0"
  },
  "devDependencies": {
    "prisma": "^5.10.0"
  }
}
```

## 🚀 Siguientes Pasos
1. Confirmar inicio de **Fase 1**.
2. Crear backup de base de datos actual (si tiene datos reales).
3. Proceder con instalación de `bcryptjs` y arreglar `app.listen`.
