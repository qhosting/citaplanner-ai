# --------------------------------------------------------
# CITAPLANNER AI - DOCKERFILE (EASYPANEL/PRODUCTION)
# PROTOCOLS: 148721091 (Materialization) | 520 (Abundance)
# --------------------------------------------------------

# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder

# 8888 - Protection: Clean Work Environment
WORKDIR /app

# Dependency Caching
COPY package*.json ./
RUN npm install

# Copy Source Code
COPY . .

# Build Frontend (Vite -> /dist)
RUN npm run build

# --- STAGE 2: RUNNER ---
FROM node:20-alpine AS runner

WORKDIR /app

# Environment Setup
ENV NODE_ENV=production
ENV PORT=3000

# Install Only Production Dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy Backend Core
COPY server.js ./

# Copy Frontend Build from Builder
COPY --from=builder /app/dist ./dist

# 419 488 71 - Growth: Expose Service
EXPOSE 3000

# Start Monolithic Node Server (Auto-Migrations Included in server.js)
CMD ["node", "server.js"]
