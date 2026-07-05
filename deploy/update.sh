#!/usr/bin/env bash
# ComboFinder - Full Update Script
# Run from anywhere: bash /var/www/combofinder/deploy/update.sh

set -e
cd /var/www/combofinder

echo "=== [1/6] Git pull ==="
# pnpm install regenerates pnpm-lock.yaml locally, which then blocks the next
# pull as a conflicting local change. Since it gets rewritten by pnpm install
# right after anyway, it's always safe to discard the local copy before pulling.
git checkout -- pnpm-lock.yaml 2>/dev/null || true
git pull origin main

echo "=== [2/6] Install dependencies ==="
pnpm install

echo "=== [3/6] DB migration (new tables) ==="
SUPABASE_DATABASE_URL="postgresql://postgres:AriyancomBD100@db.rueghpjcjoocorejovtz.supabase.co:5432/postgres" \
  pnpm --filter @workspace/db run push

echo "=== [4/6] Build API server ==="
pnpm --filter @workspace/api-server run build

echo "=== [5/6] Build Admin Panel + Web ==="
BASE_PATH=/admin/ PORT=1 pnpm --filter @workspace/admin-panel run build
BASE_PATH=/ PORT=1 pnpm --filter @workspace/combo-finder-web run build

echo "=== [6/6] Copy static files ==="
mkdir -p /var/www/combofinder/admin
mkdir -p /var/www/combofinder/web
cp -r artifacts/admin-panel/dist/public/* /var/www/combofinder/admin/
cp -r artifacts/combo-finder-web/dist/public/* /var/www/combofinder/web/

echo "=== Restart API server via pm2 ==="
# startOrRestart: already running হলে restart করবে, না থাকলে নতুন করে start করবে
# অন্য pm2 processes এ কোনো effect নেই
pm2 startOrRestart /var/www/combofinder/deploy/ecosystem.config.cjs --only api-server
pm2 save

echo ""
echo "=== Done! ==="
pm2 list
