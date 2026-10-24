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

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ADMIN_DOMAIN
ARG NEXT_PUBLIC_API_URL

COPY --from=deps /app ./
COPY web/ ./web/
# Drop host-built Prisma engines so alpine generate produces musl binaries
RUN rm -rf ./web/generated/prisma/libquery_engine-*.node ./web/node_modules/.prisma 2>/dev/null || true
RUN npx prisma generate --schema=./web/prisma/schema.prisma
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ADMIN_DOMAIN=${NEXT_PUBLIC_ADMIN_DOMAIN}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/app/web/mocked-google-fonts.cjs
RUN cd web && NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/app/web/mocked-google-fonts.cjs pnpm build

# Production image
FROM base AS production

RUN apk add --no-cache su-exec

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN npm install -g prisma@6.11.1
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./web/public
COPY --from=builder --chown=nextjs:nodejs /app/web/prisma ./web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/web/scripts/docker-entrypoint.sh ./web/scripts/docker-entrypoint.sh
RUN chmod +x ./web/scripts/docker-entrypoint.sh

USER root

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health | grep -q UP || exit 1

RUN sed -i 's/\r$//' /app/web/scripts/docker-entrypoint.sh

ENTRYPOINT ["/app/web/scripts/docker-entrypoint.sh"]
CMD []
