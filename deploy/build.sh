#!/bin/bash
# ComboFinder Build Script
# Replit থেকে code download করে VPS-এ এই script চালান
# চালানোর জায়গা: /var/www/combofinder/ (project root)

set -e
echo "→ Dependencies install করছি..."
pnpm install --frozen-lockfile

echo "→ Database schema push করছি..."
pnpm --filter @workspace/db run push

echo "→ API Server build করছি..."
pnpm --filter @workspace/api-server run build

echo "→ Admin Panel build করছি..."
pnpm --filter @workspace/admin-panel run build

echo "→ Build files সরাচ্ছি..."
cp -r artifacts/admin-panel/dist/* /var/www/combofinder/admin/
cp -r artifacts/api-server/dist /var/www/combofinder/api-server/

echo "✅ Build সম্পূর্ণ!"
