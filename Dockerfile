# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Keep Prisma CLI and tsx available in a dedicated one-off image.
# The production runner remains small and does not need development tools.
FROM dependencies AS db-tools
WORKDIR /app
COPY . .
CMD ["npm", "run", "db:push"]

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
ENV AUTH_SECRET="build-only-secret-that-is-not-used-at-runtime"
ARG NEXT_PUBLIC_SITE_URL=https://example.invalid
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p public/uploads \
  && chown -R nextjs:nodejs public/uploads

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
