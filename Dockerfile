# [AURUM PROTOCOL] - DOCKERFILE PRODUCTION
# PRODUCTO: CITAPLANNER ELITE BUSINESS SUITE
# REVISIÓN: 2026.3
# STATUS: PRODUCTION READY

# --- FASE 1: BUILDER ---
FROM node:20-alpine AS builder

# Instalación de dependencias del sistema para compilación
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia de archivos de dependencias
COPY package*.json ./
RUN npm install

# Copia del código fuente
COPY . .

# Build del Frontend (Vite)
# Se asume que el comando 'build' genera la carpeta 'dist'
RUN npm run build

# --- FASE 2: RUNNER ---
FROM node:20-alpine AS runner

WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Seguridad: Creación de usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 citaplanner

# Directorio de persistencia para imágenes cargadas por el usuario
RUN mkdir -p /app/uploads && chown -R citaplanner:nodejs /app/uploads

# Copia de artefactos de construcción desde la fase builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Instalación exclusiva de dependencias de producción
RUN npm install --omit=dev

# Ajuste final de permisos
RUN chown -R citaplanner:nodejs /app

# Cambio a usuario seguro
USER citaplanner

# Exposición del puerto del nodo Aurum
EXPOSE 3000

# Punto de entrada
CMD ["node", "server.js"]

# METADATA DE DESPLIEGUE PARA EASYPANEL:
# - Mount point: /app/uploads (Recomendado para persistencia de logos/fotos)
# - Requerido: Variable DATABASE_URL apuntando a PostgreSQL.
# - Requerido: Variable API_KEY (Google Gemini).
