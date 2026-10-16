# Build context: repository root.
# Railway: config file path apps/web/railway.json (sets this Dockerfile and the health check).
FROM node:24-alpine AS base
RUN npm install -g pnpm@11.5.2 turbo@2.11.3
WORKDIR /app

# 1. Keep only the parts of the monorepo the web app depends on.
FROM base AS prune
COPY . .
RUN turbo prune web --docker

# 2. Install and build. Next.js emits a self-contained server in .next/standalone.
FROM base AS build
COPY --from=prune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ .
# No API access needed at build time: pages render per request and the browser calls /api on this app.
ENV NEXT_TELEMETRY_DISABLED=1
RUN turbo run build --filter=web

# 3. Final image: the standalone server plus static assets.
FROM node:24-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
# Owned by `node` so Next.js can write its cache (ISR) at runtime.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
