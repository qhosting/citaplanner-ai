# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.02.18.6 (Elite Performance Edition)
# STATUS: READY FOR CLOUD DEPLOYMENT

# --- FASE 1: BUILDER (Compilación y Preparación) ---
FROM node:20-alpine AS builder

# Instalación de dependencias de sistema críticas para módulos nativos y optimización de compilación
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copia de manifiestos de dependencias para aprovechar la caché de capas de Docker
COPY package.json package-lock.json* ./

# Instalación de todas las dependencias (incluyendo devDependencies para el build)
RUN npm install --legacy-peer-deps

# Copia del código fuente completo al entorno de compilación
COPY . .

# Generación del bundle de producción optimizado (Vite -> /dist)
# Esto genera el frontend estático que el server.js servirá
RUN npm run build

# --- FASE 2: RUNNER (Imagen Final de Operación) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Definición de parámetros de entorno operativos por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Creación de usuario de sistema sin privilegios root (Protocolo de Blindaje Aurum)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 citaplanner

# Preparación de directorios para persistencia de activos y logs con permisos correctos
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia selectiva de activos desde el Builder
# Solo movemos lo indispensable para la ejecución para minimizar la superficie de ataque
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

# Instalación de dependencias de producción únicamente
RUN npm install --only=production --legacy-peer-deps

# Sincronización final de permisos para el usuario citaplanner
RUN chown -R citaplanner:nodejs /app

# Cambio de contexto al usuario de seguridad (Non-root execution)
USER citaplanner

# Monitor de Integridad (Healthcheck)
# Valida que el servicio interno esté respondiendo correctamente
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Exposición del puerto del microservicio
EXPOSE 3000

# Activación del Nodo Maestro de CitaPlanner
# Se utiliza 'node server.js' directamente para evitar overhead de npm en producción
CMD ["node", "server.js"]
