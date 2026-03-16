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
# Only generate client — no db push at build time (no DATABASE_URL yet)
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────
# Stage 3: Runner
# ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install TeX Live for PDF compilation
RUN apk add --no-cache \
    texlive \
    texmf-dist-latexextra \
    texmf-dist-fontsrecommended \
    openssl \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create dirs for uploads and outputs
RUN mkdir -p uploads outputs && chown -R nextjs:nodejs uploads outputs prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Push DB schema then start — DATABASE_URL is available here at runtime
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma && node server.js"]
