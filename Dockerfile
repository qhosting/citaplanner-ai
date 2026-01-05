# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.10.17 (Critical Build Fix)
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
ARG NODE_ENV=production

# Exponer variables al proceso de build
ENV DATABASE_URL=$DATABASE_URL
ENV API_KEY=$API_KEY
ENV GEMINI_API_KEY=$API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DOMAIN_URL=$DOMAIN_URL
ENV NODE_ENV=$NODE_ENV

# Optimización de Capas
COPY package*.json ./

# FIX: Forzamos versiones específicas conocidas por ser estables con Vite 6+ 
# y evitamos el error de resolución de Zod interno.
RUN npm install --legacy-peer-deps && \
    npm install zod@3.24.1 react-hook-form@7.54.1 @hookform/resolvers@3.9.1 --legacy-peer-deps

# Inyección total del código fuente
COPY . .

# Generación del bundle de alta disponibilidad
RUN npm run build

# --- FASE 2: RUNNER (Nodo de Operación Master) ---
FROM node:20-alpine AS runner

LABEL maintainer="Aurum Capital Technology"
LABEL version="4.6.2"
LABEL environment="production"

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Aislamiento de proceso
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Persistencia Crítica
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia de binarios validados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Instalación de dependencias de runtime (excluyendo dev-tools)
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Sellado de permisos
RUN chown -R citaplanner:nodejs /app

USER citaplanner

# Protocolo de Salud
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

# Activación del Protocolo Aurum Core
CMD ["node", "server.js"]
