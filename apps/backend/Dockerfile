FROM node:20-slim

# Install OpenSSL for Prisma + other deps
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy all package.json files (needed for workspace)
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install ALL dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN pnpm --filter backend exec -- npx prisma generate

# Copy backend source files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/nest-cli.json ./apps/backend/nest-cli.json
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY apps/backend/tsconfig.build.json ./apps/backend/tsconfig.build.json

# Build NestJS — output goes to /app/apps/backend/dist/
RUN pnpm --filter backend build

# Verify build output exists (fails build if missing)
RUN ls -la /app/apps/backend/dist/main.js

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "cd /app/apps/backend && npx prisma migrate deploy && node dist/main.js"]
