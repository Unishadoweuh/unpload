# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build packages and apps
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 unpload

# Create data directories
RUN mkdir -p /data/uploads && chown -R unpload:nodejs /data

# Copy built assets
COPY --from=builder --chown=unpload:nodejs /app/apps/api/dist ./api/dist
COPY --from=builder --chown=unpload:nodejs /app/apps/api/prisma ./api/prisma
COPY --from=builder --chown=unpload:nodejs /app/apps/api/node_modules ./api/node_modules
COPY --from=builder --chown=unpload:nodejs /app/apps/web/.next ./web/.next
COPY --from=builder --chown=unpload:nodejs /app/apps/web/public ./web/public
COPY --from=builder --chown=unpload:nodejs /app/apps/web/node_modules ./web/node_modules
COPY --from=builder --chown=unpload:nodejs /app/apps/web/package.json ./web/package.json
COPY --from=builder --chown=unpload:nodejs /app/node_modules ./node_modules

# Copy startup script
COPY --chown=unpload:nodejs docker/start.sh ./start.sh
RUN chmod +x ./start.sh

USER unpload

EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/wizard/status || exit 1

CMD ["./start.sh"]
