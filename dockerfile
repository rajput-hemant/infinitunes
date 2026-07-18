# 1. Install dependencies only when needed
FROM oven/bun:1.3.14 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
RUN bun install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM oven/bun:1.3.14 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ARG IS_DOCKER=true
ENV IS_DOCKER=$IS_DOCKER

# Env validation is skipped at build time; runtime variables are supplied to the
# container. Provide real values via the environment when running the image.
ARG SKIP_ENV_VALIDATION=true
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION

RUN bun run --filter @infinitunes/web build

# 3. Production image, copy all the files and run next
FROM node:22.11.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/apps/web/public ./apps/web/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# The monorepo standalone output nests the server under apps/web.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

ARG PORT=3000

EXPOSE $PORT
ENV PORT $PORT

CMD ["node", "apps/web/server.js"]
