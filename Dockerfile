# ─────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --frozen-lockfile

# ─────────────────────────────────────────
# Stage 2: Builder
# ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ─────────────────────────────────────────
# Stage 3: Runner
# ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install TeX Live for PDF compilation
RUN apk add --no-cache \
    texlive \
    texlive-xetex \
    texmf-dist-latexextra \
    texmf-dist-fontsextra \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public 2>/dev/null || true
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create directories for uploads and outputs
RUN mkdir -p uploads outputs && chown -R nextjs:nodejs uploads outputs

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run DB migration then start
CMD ["sh", "-c", "npx prisma db push && node server.js"]
