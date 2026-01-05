# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION MIRROR
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE
# REVISIÓN: 2026.4.6
# STATUS: PRODUCTION DEPLOYMENT READY
# INFRASTRUCTURE: AURUM CAPITAL TECHNOLOGY ECOSYSTEM

# --- FASE 1: BUILDER (Compilación del Núcleo) ---
FROM node:20-alpine AS builder

# Dependencias de sistema para Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Sincronización de manifiestos
COPY package*.json ./

# Instalación de dependencias de construcción
RUN npm install

# Inyección de código fuente
COPY . .

# Generación del bundle de producción (Vite -> Dist)
RUN npm run build

# --- FASE 2: RUNNER (Nodo de Ejecución) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Configuración de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Usuario de sistema restringido
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Persistencia: Directorio de activos multimedia (Multer Target)
# Este directorio debe mapearse a un volumen externo en producción
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Transferencia de binarios y activos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Instalación limpia de dependencias de runtime
RUN npm install --omit=dev

# Permisos finales de infraestructura
RUN chown -R citaplanner:nodejs /app

# Cambio de contexto a usuario seguro
USER citaplanner

# Puerto de servicio
EXPOSE 3000

# Activación del Protocolo Aurum
CMD ["node", "server.js"]

# --- GUÍA DE ORQUESTACIÓN ---
# 1. DATABASE: Requiere enlace con PostgreSQL via DATABASE_URL.
# 2. IA CORE: Requiere GEMINI_API_KEY en variables de entorno.
# 3. VOLÚMENES: Montar /app/uploads para evitar pérdida de imágenes.
# 4. RED: Nodo configurado para responder en puerto 3000.
