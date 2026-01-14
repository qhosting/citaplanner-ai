# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER NEXUS SaaS BUSINESS SUITE
# REVISIÓN: 2026.02.24.1 (Nexus Ultra-Performance Edition)
# STATUS: READY FOR GLOBAL CLOUD DEPLOYMENT

# --- FASE 1: BUILDER (Compilación de Alta Eficiencia) ---
FROM node:20-alpine AS builder

# Instalación de dependencias de sistema para módulos nativos (ej. argon2, sharp si se añadieran)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copia de manifiestos con prioridad para caché de capas
COPY package.json package-lock.json* ./

# Instalación de dependencias completa (Core + Dev)
RUN npm install --legacy-peer-deps

# Transferencia del código fuente para compilación
COPY . .

# Generación del bundle de producción (Vite Optimized Build)
# Este paso minimiza y ofusca el frontend para una carga instantánea
RUN npm run build

# --- FASE 2: RUNNER (Imagen de Ejecución Blindada) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Inyección de parámetros de entorno operativos
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=UTC

# Protocolo de Blindaje Aurum: Ejecución sin privilegios root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 citaplanner

# Preparación de volúmenes persistentes para activos dinámicos
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia selectiva de activos compilados (Zero-Waste Strategy)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

# Instalación exclusiva de dependencias de tiempo de ejecución (Omit DevDeps)
# Esto reduce la superficie de ataque y el tamaño de la imagen final
RUN npm install --omit=dev --legacy-peer-deps

# Sincronización final de propiedad de archivos
RUN chown -R citaplanner:nodejs /app

# Cambio de contexto a usuario de seguridad
USER citaplanner

# Monitor de Integridad (Healthcheck) - Calibrado para Nexus Latency
# Valida que el endpoint de configuración responda en menos de 10s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/settings/landing').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Exposición del puerto de servicio
EXPOSE 3000

# Activación del Nodo Maestro Nexus
# Se invoca directamente el motor node para máxima eficiencia de memoria
CMD ["node", "server.js"]
