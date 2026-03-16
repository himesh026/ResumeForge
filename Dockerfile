FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    texlive \
    texmf-dist-latexextra \
    texmf-dist-fontsrecommended \
    && rm -rf /var/cache/apk/*

# Copy package and install dependencies
COPY package.json ./
RUN npm install --frozen-lockfile

# Copy all source files
COPY . .

# Set Prisma binary target for Alpine
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Create dirs for uploads/outputs
RUN mkdir -p uploads outputs /app/prisma

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Push DB schema and start
CMD ["sh", "-c", "npx prisma db push && node .next/standalone/server.js"]
