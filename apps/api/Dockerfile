# Build context: repository root.
# Railway: config file path apps/api/railway.json (sets this Dockerfile and the health check).
FROM node:24-alpine AS base
# Compiler toolchain for better-sqlite3, used only if no prebuilt binary matches this image. Not in the final image.
RUN apk add --no-cache python3 make g++ && npm install -g pnpm@11.5.2 turbo@2.11.3
WORKDIR /app

# 1. Keep only the parts of the monorepo the API depends on.
FROM base AS prune
COPY . .
RUN turbo prune api --docker

# 2. Install everything and compile. The install layer is cached until a package.json or the lockfile changes.
FROM base AS build
COPY --from=prune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN turbo run build --filter=api

# 3. Runtime dependencies only.
FROM base AS deps
COPY --from=prune /app/out/json/ .
RUN pnpm install --frozen-lockfile --prod

# 4. Final image: runtime deps, compiled JS, SQL migrations and seed data. No pnpm, no sources.
FROM node:24-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/migrations ./apps/api/migrations
COPY --from=build /app/apps/api/seeds ./apps/api/seeds
# Default DATABASE_PATH (data/app.db) lives here and is lost with the container.
# On Railway: attach a volume at /data and set DATABASE_PATH=/data/app.db and RAILWAY_RUN_UID=0
# (volumes are mounted as root, and this image otherwise runs as `node`, which could not write to it).
RUN mkdir -p /app/apps/api/data && chown node:node /app/apps/api/data
USER node
WORKDIR /app/apps/api
EXPOSE 4000
# Apply pending migrations, load the seed data (idempotent), then start. If either step fails, the
# container exits and the deploy fails.
CMD ["sh", "-c", "node dist/migrate.js && node dist/scripts/seed.js && exec node dist/index.js"]
