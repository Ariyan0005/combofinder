#!/usr/bin/env bash
# ComboFinder - Full Update Script
# Run from anywhere: bash /var/www/combofinder/deploy/update.sh

set -e
cd /var/www/combofinder

echo "=== [1/6] Git sync (force) ==="
# Always sync exactly with GitHub, discarding any local changes.
git fetch origin main
git reset --hard origin/main

# Re-exec this script with the freshly updated version so any changes
# to update.sh itself take effect immediately (not on the next run).
if [[ "${_COMBOFINDER_REXEC:-}" != "1" ]]; then
  _COMBOFINDER_REXEC=1 exec bash "$0"
fi

echo "=== [2/6] Install dependencies ==="
pnpm install

echo "=== [3/6] DB migration (new tables) ==="
# Load DB URL from .env — drizzle-kit did this automatically, we do it explicitly
set -a && [ -f /var/www/combofinder/.env ] && source /var/www/combofinder/.env && set +a
pnpm --filter @workspace/db run migrate || echo "⚠ DB migration failed — skipping, app will still run"

echo "=== [4/6] Build API server ==="
pnpm --filter @workspace/api-server run build

echo "=== [5/6] Build Admin Panel + Web ==="
BASE_PATH=/admin/ PORT=1 pnpm --filter @workspace/admin-panel run build
BASE_PATH=/ PORT=1 pnpm --filter @workspace/combo-finder-web run build

echo "=== [6/6] Deploy static files (clear old, copy new) ==="
# Clear first — prevents stale hashed JS chunks from accumulating
rm -rf /var/www/combofinder/admin
mkdir -p /var/www/combofinder/admin
cp -r artifacts/admin-panel/dist/public/* /var/www/combofinder/admin/

rm -rf /var/www/combofinder/web
mkdir -p /var/www/combofinder/web
cp -r artifacts/combo-finder-web/dist/public/* /var/www/combofinder/web/

echo "=== Reload nginx (picks up any nginx config changes) ==="
nginx -t && systemctl reload nginx || echo "⚠ nginx reload failed — check config"

echo "=== Restart API server via systemd ==="
systemctl restart combofinder-api
systemctl is-active --quiet combofinder-api && echo "combofinder-api: running ✓" || echo "⚠ combofinder-api failed to start — check: journalctl -u combofinder-api -n 50"

echo ""
echo "=== Done! ==="
