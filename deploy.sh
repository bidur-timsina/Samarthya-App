#!/bin/bash
# ── Shubha Yatra Academy — VPS Deploy Script ───────────────────────────────────
# Run on your server: bash deploy.sh

set -e
echo "🚀 Deploying Shubha Yatra Academy API..."

cd /var/www/shubhayatra/backend

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
