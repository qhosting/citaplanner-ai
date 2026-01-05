# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.10.12
# STATUS: PRODUCTION DEPLOYMENT READY
# INFRASTRUCTURE: AURUM CAPITAL TECHNOLOGY ECOSYSTEM

# --- FASE 1: BUILDER (Arquitectura de Compilación) ---
FROM node:20-alpine AS builder

# Dependencias de sistema optimizadas para libc
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Inyección de manifiestos y dependencias
COPY package*.json ./
RUN npm install --frozen-lockfile

# Inyección total del código fuente
COPY . .

# Generación del bundle de alta disponibilidad (Vite -> Dist)
# Se asume que las variables de compilación están en el entorno
RUN npm run build

# --- FASE 2: RUNNER (Nodo de Operación Master) ---
FROM node:20-alpine AS runner

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
RUN npm install --omit=dev

# Sellado de permisos de infraestructura
RUN chown -R citaplanner:nodejs /app

# Switch a modo de operación seguro
USER citaplanner

# Apertura de puertos de red
EXPOSE 3000

# Activación del Protocolo Aurum Core
CMD ["node", "server.js"]

# --- GUÍA DE ORQUESTACIÓN PARA NODOS ELITE ---
#
# 1. DATABASE CORE: Requiere PostgreSQL 15+ vía DATABASE_URL.
# 2. IA ENGINE: Requiere API_KEY de Google Gemini (Flash 2.5/3.0).
# 3. SaaS DNS ENGINE: Para aprovisionamiento automático requiere:
#    - CLOUDFLARE_ZONE_ID
#    - CLOUDFLARE_API_KEY
#    - CLOUDFLARE_EMAIL
# 4. STORAGE: El volumen /app/uploads DEBE ser persistente (EBS/NFS/Bind Mount).
# 5. NETWORKING: Soporta Wildcard DNS (*.citaplanner.com) para multi-tenancy.
