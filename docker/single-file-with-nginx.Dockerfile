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

# --- Final Image with Nginx ---
FROM nginx:alpine AS runner

WORKDIR /app

# Install Node.js runtime for backend
RUN apk add --no-cache nodejs

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 omnigate

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=omnigate:nodejs /app/apps/web/.next/standalone ./frontend/standalone
COPY --from=builder --chown=omnigate:nodejs /app/apps/web/.next/static ./frontend/standalone/apps/web/.next/static
COPY --from=builder --chown=omnigate:nodejs /app/apps/web/public ./frontend/standalone/apps/web/public
COPY --from=builder --chown=omnigate:nodejs /app/apps/server/dist ./backend

# Change permissions for Nginx logs & cache
RUN chown -R omnigate:nodejs /var/cache/nginx /var/log/nginx /tmp

# Copy Nginx config
COPY ./nginx/nginx-single-file.conf /etc/nginx/nginx.conf

USER omnigate

# Expose necessary ports
EXPOSE 8080

ENV HOSTNAME="0.0.0.0"
ENV IS_DOCKER="true"
ENV NODE_ENV="production"
ENV PORT=3000

# Start backend & frontend in the background, then run Nginx
CMD node /app/backend/index.js & node /app/frontend/standalone/apps/web/server.js & nginx -g "daemon off;"