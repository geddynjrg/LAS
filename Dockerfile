ARG NODE_VERSION=20

# Base image with dependencies
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat wget
RUN npm install -g pnpm@10
WORKDIR /app

# Install all dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY web/package.json ./web/
COPY storybook/package.json ./storybook/
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder

COPY --from=deps /app ./
COPY web/ ./web/
RUN pnpm --filter=web db:generate
RUN pnpm --filter=web build

# Production image
FROM base AS production


WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./web/public

# Copy Prisma schema and migrations (required for 'prisma migrate deploy' on startup)
COPY --from=builder --chown=nextjs:nodejs /app/web/prisma ./web/prisma

# Copy container entrypoint script (waits for DB, runs migrations, starts app)
COPY --from=builder --chown=nextjs:nodejs /app/web/scripts/docker-entrypoint.sh ./web/scripts/docker-entrypoint.sh
RUN chmod +x ./web/scripts/docker-entrypoint.sh

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["/app/web/scripts/docker-entrypoint.sh"]