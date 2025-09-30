FROM oven/bun:1 AS base

# Install deps
FROM base AS deps
WORKDIR /app
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN bun run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["bun", "server.js"]
