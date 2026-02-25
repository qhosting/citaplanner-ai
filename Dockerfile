# --- STAGE 1: BUILDER ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

# Optimize NPM for problematic network connections
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set network-timeout 100000

# Dependency Caching - Using ci for stability
COPY package*.json ./
RUN npm ci

# Copy Source Code
COPY . .

# Generate Prisma Client (Manually here to handle potential failure better)
RUN npx prisma generate

# Build Frontend (Vite -> /dist)
RUN npm run build

# --- STAGE 2: RUNNER ---
FROM node:20-bookworm-slim AS runner

# Install Production Tools
RUN apt-get update && apt-get install -y postgresql-client openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Environment Setup
ENV NODE_ENV=production
ENV PORT=3000
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Install Only Production Dependencies
COPY package*.json ./
RUN npm config set fetch-retries 10 && \
    npm ci --only=production

# Copy Backend Core
COPY server.js ./
COPY services ./services
COPY middleware ./middleware
COPY schemas ./schemas
COPY prisma ./prisma

# Generate Prisma Client for Production
RUN npx prisma generate

# Copy Frontend Build from Builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start Monolithic Node Server
CMD ["node", "server.js"]
