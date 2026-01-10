
# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.10.22 (Dependency Lock & Multi-Stage Fix)
# STATUS: PRODUCTION DEPLOYMENT READY
# INFRASTRUCTURE: AURUM CAPITAL TECHNOLOGY ECOSYSTEM

# --- FASE 1: BUILDER (Arquitectura de Compilación) ---
FROM node:20-alpine AS builder

# Dependencias de sistema para compilación de binarios nativos
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Argumentos de construcción (Inyectados por Easypanel)
ARG DATABASE_URL
ARG API_KEY
ARG NEXTAUTH_SECRET
ARG DOMAIN_URL

# Exponer variables al proceso de build (Necesarias para Vite inline replacement)
ENV DATABASE_URL=$DATABASE_URL
ENV API_KEY=$API_KEY
ENV GEMINI_API_KEY=$API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DOMAIN_URL=$DOMAIN_URL

# Optimización de Capas: Copiar definiciones primero
COPY package*.json ./

# Instalación INICIAL (incluye devDependencies para tener acceso a 'vite')
# Usamos legacy-peer-deps para evitar bloqueos iniciales por versiones de react-hook-form
RUN NODE_ENV=development npm install --legacy-peer-deps

# Inyección total del código fuente
COPY . .

# CORRECCIÓN CRÍTICA DE DEPENDENCIAS & SERVER DEPS
# 1. Reinstalamos versiones compatibles explícitas para asegurar integridad.
# 2. Instalamos dependencias del servidor (redis, jsonwebtoken) para que queden en node_modules.
RUN npm install react-hook-form@7.54.1 @hookform/resolvers@3.9.1 redis@4.6.13 jsonwebtoken@9.0.2 --save --legacy-peer-deps

# Generación del bundle de alta disponibilidad
RUN npm run build

# Limpieza de dependencias de desarrollo (Vite, Typescript, etc.)
# Esto deja en node_modules solo lo necesario para producción (Express, PG, etc.)
RUN npm prune --production

# --- FASE 2: RUNNER (Nodo de Operación Master) ---
FROM node:20-alpine AS runner

LABEL maintainer="Aurum Capital Technology"
LABEL version="4.8.0"
LABEL environment="production"

WORKDIR /app

# Definimos Producción solo en el Runtime final
ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Aislamiento de proceso
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Persistencia Crítica de Archivos
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia de binarios y dependencias validadas desde el Builder
# CRÍTICO: No ejecutamos npm install aquí para evitar reevaluación de dependencias y errores ERESOLVE
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Sellado de permisos
RUN chown -R citaplanner:nodejs /app

USER citaplanner

# Protocolo de Salud (Tenant Check)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

# Activación del Protocolo Aurum Core
CMD ["node", "server.js"]
