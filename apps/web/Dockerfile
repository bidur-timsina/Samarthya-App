FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy all package.json files
COPY apps/backend/package.json ./apps/backend/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy web source
COPY apps/web ./apps/web/

WORKDIR /app/apps/web

# Build Next.js
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start"]
