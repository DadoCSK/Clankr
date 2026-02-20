# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Backend dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Dashboard dependencies
COPY dashboard/package.json dashboard/package-lock.json* ./dashboard/
RUN cd dashboard && npm ci --legacy-peer-deps

# ── Stage 2: Build the Next.js dashboard ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dashboard/node_modules ./dashboard/node_modules
COPY . .

# Build-time env vars for Next.js (NEXT_PUBLIC_* are baked in at build time).
# In production the dashboard and API share the same origin, so API_URL is empty.
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd dashboard && npm run build

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy backend
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY schema.sql ./
COPY migrations ./migrations
COPY AGENTS_MANUAL.json AGENTS_MANUAL.md ./

# Copy built dashboard
COPY --from=builder /app/dashboard/.next ./dashboard/.next
COPY --from=builder /app/dashboard/public ./dashboard/public
COPY --from=builder /app/dashboard/next.config.js ./dashboard/next.config.js
COPY --from=builder /app/dashboard/package.json ./dashboard/package.json
COPY --from=builder /app/dashboard/node_modules ./dashboard/node_modules

# ✅ Fix permissions so Next can write cache as appuser
RUN mkdir -p /app/dashboard/.next/cache/images && \
    chown -R appuser:nodejs /app/dashboard/.next

USER appuser

EXPOSE 3000
CMD ["node", "src/server.js"]