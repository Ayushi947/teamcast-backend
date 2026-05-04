# =============================
# Stage 1 — Build Stage (Alpine Linux)
# =============================
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/
RUN mkdir -p ./uploads

# Install dependencies
RUN npm install --frozen-lockfile --ignore-scripts

# Generate Prisma Client (now correctly targeting debian-openssl-3.0.x)
RUN npm run generate

# Copy source files
COPY tsconfig*.json ./
COPY src ./src/
COPY scripts ./scripts/
COPY assets ./assets/

# Build the Node.js app
RUN npm run build

# Cleanup unnecessary files to reduce image size
RUN npm prune --production && \
    rm -rf /root/.npm /tmp/* ~/.cache src tsconfig*.json scripts

# =============================
# Stage 2 — Runtime (Alpine Linux with Node.js)
# =============================
FROM node:18-alpine AS runtime

# Install FFmpeg, wget for healthcheck, and system fonts
RUN apk add --no-cache \
    gcc \
    g++ \
    make \
    libffi-dev \
    musl-dev \
    geos-dev \
    python3-dev \
    ffmpeg \
    dos2unix \
    fontconfig \
    ttf-dejavu \
    ttf-liberation \
    && fc-cache -fv \
    && mkdir -p /app/assets/fonts

WORKDIR /app

# Copy built application and runtime dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/assets ./assets

# Create and set permissions for uploads and tmp directories
RUN mkdir -p /app/uploads /app/tmp && \
    chown -R node:node /app/uploads /app/tmp /app/assets && \
    chmod -R 755 /app/assets/fonts

# Switch to non-root user for security
USER node

# Expose application port
EXPOSE 4300

# Healthcheck (Optional)
HEALTHCHECK CMD ["wget", "--spider", "-q", "http://localhost:4300/health"]

# Default CMD baked inside image for app startup
CMD ["node", "--expose-gc", "--max-old-space-size=512", "--max-semi-space-size=64", "--optimize-for-size", "dist/src/index.js"]
