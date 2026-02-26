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
    npm config set fetch-timeout 300000

# Dependency Caching - Using ci with forced retries loop for unstable environment
COPY package*.json ./
RUN n=0; until [ "$n" -ge 5 ]; do \
    npm ci && break; \
    n=$((n+1)); \
    echo "Falla detectada en transferencia Prisma/NPM. Reintentando ($n/5)..."; \
    sleep 20; \
    done || exit 1

# Copy Source Code
COPY . .

# Generate Prisma Client (Manually here to handle potential failure better)
RUN npx prisma generate

# Build Frontend (Vite -> /dist)
RUN npm run build

# Prune devDependencies to keep only production modules for the runner
RUN npm prune --production

# --- STAGE 2: RUNNER ---
FROM node:20-bookworm-slim AS runner

# Install Production Tools
RUN apt-get update && apt-get install -y postgresql-client openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Environment Setup
ENV NODE_ENV=production
ENV PORT=3000
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Copy Production Dependencies from Builder
# This avoids re-downloading engines and handles network instability
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy Backend Core
COPY server.js ./
COPY services ./services
COPY middleware ./middleware
COPY schemas ./schemas
COPY prisma ./prisma

# No need to generate again if we copied node_modules including .prisma/client
# but we run it just in case the path was absolute or needs refresh, 
# though with the copy it should be fine.
RUN npx prisma generate

# Copy Frontend Build from Builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start Monolithic Node Server
CMD ["node", "server.js"]
