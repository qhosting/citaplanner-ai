# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.10.16 (Build Fix - Resolver Conflict)
# STATUS: PRODUCTION DEPLOYMENT READY
# INFRASTRUCTURE: AURUM CAPITAL TECHNOLOGY ECOSYSTEM

# --- FASE 1: BUILDER (Arquitectura de Compilación) ---
FROM node:20-alpine AS builder

# Dependencias de sistema para compilación de binarios nativos
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Argumentos de construcción (Inyectados por CI/CD o Easypanel)
ARG DATABASE_URL
ARG API_KEY
ARG NEXTAUTH_SECRET
ARG DOMAIN_URL
ARG NODE_ENV=production

# Exponer variables al proceso de build (Vite las requiere para el bundle)
ENV DATABASE_URL=$DATABASE_URL
ENV API_KEY=$API_KEY
ENV GEMINI_API_KEY=$API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DOMAIN_URL=$DOMAIN_URL
ENV NODE_ENV=$NODE_ENV

# Optimización de Capas: Instalación de dependencias primero
COPY package*.json ./

# FIX: Se usa --legacy-peer-deps para ignorar conflictos estrictos de peerDependencies
# entre react-hook-form y sus resolvers durante la transición de versiones.
RUN npm install --legacy-peer-deps

# Inyección total del código fuente para transpilación
COPY . .

# Generación del bundle de alta disponibilidad (Vite -> Dist)
RUN npm run build

# --- FASE 2: RUNNER (Nodo de Operación Master) ---
FROM node:20-alpine AS runner

LABEL maintainer="Aurum Capital Technology"
LABEL version="4.6.1"
LABEL environment="production"

WORKDIR /app

# Variables de entorno de Operación
ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Aislamiento de proceso con usuario restringido
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Persistencia Crítica: Directorio de activos multimedia (Multer/SaaS)
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia de binarios validados y estructura de servidor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Instalación de dependencias de runtime (excluyendo dev-tools)
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Sellado de permisos de infraestructura
RUN chown -R citaplanner:nodejs /app

# Switch a modo de operación seguro
USER citaplanner

# Protocolo de Salud: Monitoreo de disponibilidad del Nodo SaaS
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Apertura de puertos de red
EXPOSE 3000

# Activación del Protocolo Aurum Core
CMD ["node", "server.js"]
