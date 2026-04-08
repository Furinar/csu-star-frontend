module.exports = {
  apps: [
    {
      name: "csu-star-frontend",
      cwd: "/var/www/html/csustar.wiki",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      exp_backoff_restart_delay: 100,
    },
  ],
};
