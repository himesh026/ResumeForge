FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    && rm -rf /var/cache/apk/*

COPY package.json ./
RUN npm install --frozen-lockfile

COPY . .

ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"

RUN npx prisma generate

RUN npm run build

# Copy static files into standalone
RUN cp -r .next/static .next/standalone/.next/static

# Create data directory with open permissions
RUN mkdir -p /app/data /app/uploads /app/outputs && chmod 777 /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["sh", "-c", "chmod 777 /app/data && npx prisma db push --schema=/app/prisma/schema.prisma && node .next/standalone/server.js"]
