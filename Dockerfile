# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.02.18.3 (Stable Release)
# STATUS: READY FOR CLOUD DEPLOYMENT

# --- FASE 1: BUILDER (Compilación y Preparación) ---
FROM node:20-alpine AS builder

# Instalación de dependencias de sistema necesarias para módulos nativos de Node/PG
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copia de manifiestos de dependencias
COPY package.json package-lock.json* ./

# Instalación limpia de dependencias (incluyendo herramientas de construcción)
RUN npm ci --legacy-peer-deps

# Copia del código fuente completo del ecosistema
COPY . .

# Generación del bundle de producción (Vite -> /dist)
# Se inyectan variables de entorno base si el build de Vite las requiere
RUN npm run build

# --- FASE 2: RUNNER (Imagen Final de Operación) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Definición de parámetros de entorno operativos
ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Creación de usuario de sistema sin privilegios root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Creación de volúmenes para persistencia de activos (Uploads)
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia selectiva de activos desde el Builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

# Sincronización de permisos globales
RUN chown -R citaplanner:nodejs /app

# Cambio de contexto al usuario de seguridad
USER citaplanner

# Monitor de Integridad (Healthcheck) - Valida que el API de Landing responda
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Exposición del puerto del microservicio
EXPOSE 3000

# Activación del Nodo Maestro de CitaPlanner
CMD ["node", "server.js"]
