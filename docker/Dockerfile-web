# Use the official Node.js 20 image
FROM node:22-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm i --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm run build --filter=web...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./next/standalone
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./next/standalone/apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./next/standalone/apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT 3000

ENV HOSTNAME "0.0.0.0"
CMD node next/standalone/apps/web/server.js