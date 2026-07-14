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
        SUPABASE_DATABASE_URL: "postgresql://postgres:AriyancomBD100@db.rueghpjcjoocorejovtz.supabase.co:5432/postgres",
        SESSION_SECRET: "ComboFinderSecret2024AriyanBD100",
        ADMIN_USERNAME: "Ariyan005",
        ADMIN_PASSWORD: "AriyancomBD100",
      },
    },
  ],
};
