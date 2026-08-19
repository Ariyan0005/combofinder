module.exports = {
  apps: [
    {
      name: "api-server",
      script: "/var/www/combofinder/artifacts/api-server/dist/index.mjs",
      cwd: "/var/www/combofinder",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      },
    },
  ],
};
