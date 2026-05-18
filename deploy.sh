#!/bin/bash
# ── Samarthya Institute — VPS Deploy Script ───────────────────────────────────
# Run on your server: bash deploy.sh

set -e
echo "🚀 Deploying Samarthya Institute API..."

cd /var/www/samarthya/backend

# Pull latest code
git pull origin main

# Install dependencies
npm install --production=false

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build NestJS
npm run build

# Restart with PM2
pm2 reload ecosystem.config.js --env production

echo "✅ API deployed successfully"
pm2 status
