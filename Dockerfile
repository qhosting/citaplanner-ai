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

# Install Backup Tools (PostgreSQL Client & MongoDB Tools)
# Alpine requires community/edge repos for some tools
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.19/main' >> /etc/apk/repositories && \
    echo 'http://dl-cdn.alpinelinux.org/alpine/v3.19/community' >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache postgresql-client mongodb-tools

WORKDIR /app

# Environment Setup
ENV NODE_ENV=production
ENV PORT=3000

# Install Only Production Dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy Backend Core
COPY server.js ./
COPY services ./services

# Copy Frontend Build from Builder
COPY --from=builder /app/dist ./dist

# 419 488 71 - Growth: Expose Service
EXPOSE 3000

# Start Monolithic Node Server (Auto-Migrations Included in server.js)
CMD ["node", "server.js"]
