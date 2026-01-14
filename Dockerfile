# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE (SaaS EDITION)
# REVISIÓN: 2026.02.18 (Production Optimized)
# STATUS: READY FOR CLOUD DEPLOYMENT

# --- FASE 1: BUILDER (Compilación del Frontend y Preparación) ---
FROM node:20-alpine AS builder

# Instalación de dependencias de sistema para compilaciones nativas
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Inyección de argumentos de construcción (Build-time Args)
ARG DATABASE_URL
ARG API_KEY
ARG NEXTAUTH_SECRET
ARG DOMAIN_URL
ARG REDIS_URL

# Configuración del entorno de construcción
ENV NODE_ENV=production
ENV DATABASE_URL=$DATABASE_URL
ENV API_KEY=$API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DOMAIN_URL=$DOMAIN_URL
ENV REDIS_URL=$REDIS_URL

# Copia de manifiestos de dependencias
COPY package.json package-lock.json* ./

# Instalación limpia incluyendo dependencias de desarrollo para el build
# Se utiliza --legacy-peer-deps por la vanguardia de React 19
RUN npm install --legacy-peer-deps

# Copia total del código fuente
COPY . .

# Generación del bundle de producción del Frontend (Vite -> /dist)
RUN npm run build

# --- FASE 2: RUNNER (Imagen Final Aligerada) ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Creación de usuario no privilegiado (Least Privilege Principle)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Preparación de directorios para persistencia de datos (Uploads)
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Copia selectiva desde el Builder (Optimización de tamaño de capa)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

# Asignación de permisos al usuario de ejecución
RUN chown -R citaplanner:nodejs /app

# Cambio al contexto de usuario seguro
USER citaplanner

# Monitor de Salud de Infraestructura (Healthcheck)
# Verifica que el endpoint de configuración de landing responda exitosamente
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Exposición del puerto del microservicio
EXPOSE 3000

# Activación del Nodo Maestro de Operaciones
CMD ["node", "server.js"]
