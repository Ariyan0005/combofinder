#!/usr/bin/env bash
set -e

echo "=== ComboFinder Build Script ==="
echo "Domain: combofinder.iunlockd.com"
echo ""

PROJECT_DIR="/var/www/combofinder"
cd "$PROJECT_DIR"

# SUPABASE_DATABASE_URL চেক করি
if [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo "ERROR: SUPABASE_DATABASE_URL সেট করুন!"
  echo ""
  echo "এভাবে run করুন:"
  echo "  SUPABASE_DATABASE_URL='postgresql://postgres:PASS@db.rueghpjcjoocorejovtz.supabase.co:5432/postgres' bash deploy/build.sh"
  exit 1
fi

export SUPABASE_DATABASE_URL

echo "[1/5] Dependencies install করছি..."
pnpm install --frozen-lockfile

echo "[2/5] Supabase schema push করছি..."
pnpm --filter @workspace/db run push

echo "[3/5] API Server build করছি..."
pnpm --filter @workspace/api-server run build

echo "[4/5] Admin Panel build করছি (base: /admin/)..."
BASE_PATH=/admin/ PORT=1 pnpm --filter @workspace/admin-panel run build

echo "[5/5] User Web App build করছি (base: /)..."
BASE_PATH=/ PORT=1 pnpm --filter @workspace/combo-finder-web run build

echo ""
echo "=== Static files copy করছি ==="
mkdir -p /var/www/combofinder/admin
mkdir -p /var/www/combofinder/web

cp -r artifacts/admin-panel/dist/public/* /var/www/combofinder/admin/
cp -r artifacts/combo-finder-web/dist/public/* /var/www/combofinder/web/

echo ""
echo "=== Build সম্পূর্ণ! ==="
echo ""
echo "এরপর service setup করুন:"
echo ""
echo "  1) Service file এ password বসান:"
echo "     nano deploy/combofinder-api.service"
echo "     (SUPABASE_DATABASE_URL, SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD)"
echo ""
echo "  2) Service install করুন:"
echo "     cp deploy/combofinder-api.service /etc/systemd/system/"
echo "     systemctl daemon-reload"
echo "     systemctl enable combofinder-api"
echo "     systemctl restart combofinder-api"
echo "     systemctl status combofinder-api"
echo ""
echo "  3) Nginx setup করুন:"
echo "     cp deploy/nginx-combofinder.conf /etc/nginx/sites-available/combofinder"
echo "     ln -sf /etc/nginx/sites-available/combofinder /etc/nginx/sites-enabled/combofinder"
echo "     nginx -t && systemctl reload nginx"
