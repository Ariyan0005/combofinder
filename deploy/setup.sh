#!/bin/bash
# ComboFinder VPS Setup Script
# Ubuntu 20.04 / 22.04 এর জন্য
# চালানোর আগে: chmod +x setup.sh && sudo bash setup.sh

set -e
echo "=========================================="
echo "  ComboFinder VPS Setup শুরু হচ্ছে..."
echo "=========================================="

# ১. Node.js 20 install
echo ""
echo "→ Step 1: Node.js install করছি..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ২. pnpm install
echo ""
echo "→ Step 2: pnpm install করছি..."
npm install -g pnpm

# ৩. PM2 install (optional - systemd use করলে লাগবে না)
echo ""
echo "→ Step 3: PostgreSQL client tools..."
apt-get install -y postgresql-client

# ৪. Nginx install
echo ""
echo "→ Step 4: Nginx install করছি..."
apt-get install -y nginx

# ৫. Certbot install (SSL এর জন্য)
echo ""
echo "→ Step 5: Certbot install করছি (SSL এর জন্য)..."
apt-get install -y certbot python3-certbot-nginx

# ৬. www-data user কে node বলার অনুমতি দেওয়া
echo ""
echo "→ Step 6: Directory তৈরি করছি..."
mkdir -p /var/www/combofinder/admin
mkdir -p /var/www/combofinder/api-server

echo ""
echo "=========================================="
echo "  ✅ Basic setup শেষ!"
echo ""
echo "  এরপর করুন:"
echo "  1. Code upload করুন"
echo "  2. .env file তৈরি করুন"
echo "  3. npm run build চালান"
echo "  4. Nginx configure করুন"
echo "=========================================="
