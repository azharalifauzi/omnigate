# Use the official Node.js 20 image
FROM node:22-alpine AS base

FROM base AS pruner
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app

RUN yarn global add turbo
COPY . .
RUN turbo prune web @repo/server --docker

# --- Build Image ---
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
RUN corepack enable
RUN pnpm i --frozen-lockfile

# Build the project
COPY --from=pruner /app/out/full/ .
RUN pnpm run build

# --- Final Image ---
FROM alpine:latest AS runner

# Install Node.js runtime
RUN apk add --no-cache nodejs

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 omnigate

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=omnigate:nodejs /app/apps/web/.next/standalone ./frontend/standalone
COPY --from=builder --chown=omnigate:nodejs /app/apps/web/.next/static ./frontend/standalone/apps/web/.next/static
COPY --from=builder --chown=omnigate:nodejs /app/apps/web/public ./frontend/standalone/apps/web/public
COPY --from=builder --chown=omnigate:nodejs /app/apps/server/dist ./backend
COPY --from=builder --chown=omnigate:nodejs /app/apps/server/drizzle ./backend/migrate/drizzle
COPY --from=builder --chown=omnigate:nodejs /app/apps/server/drizzle ./backend/seed/drizzle

USER omnigate

# Expose necessary ports
EXPOSE 3000
EXPOSE 4000

ENV HOSTNAME="0.0.0.0"
ENV IS_SINGLE_FILE_DOCKER="true"
ENV NODE_ENV="production"

# Start backend & frontend in the background, then run Nginx
CMD PORT=3000 node /app/frontend/standalone/apps/web/server.js & PORT=4000 node /app/backend/app/index.js