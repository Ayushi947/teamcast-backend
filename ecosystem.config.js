module.exports = {
  apps: [
    {
      name: 'teamcast-backend',
      script: './dist/src/index.js',
      cwd: './',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        ENV_NAME: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENV_NAME: 'production',
      },
      env_qa: {
        NODE_ENV: 'qa',
        PORT: 3000,
        ENV_NAME: 'qa',
      },
      // PM2 specific configurations
      watch: false, // Disable file watching in production
      ignore_watch: ['node_modules', 'logs', 'uploads', 'tmp'],
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      min_uptime: '10s', // Minimum uptime before considering app stable
      max_restarts: 10, // Maximum number of restarts
      restart_delay: 4000, // Delay between restarts
      kill_timeout: 5000, // Time to wait before force killing
      wait_ready: true, // Wait for ready signal
      listen_timeout: 8000, // Time to wait for ready signal

      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Process management
      autorestart: true,
      node_args:
        '--require=perf_hooks --expose-gc --trace-gc --trace-gc-ignore-scavenger',

      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // Environment variables that should be loaded from .env file
      env_file: '.env',
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/teamcast-backend.git',
      path: '/var/www/teamcast-backend',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    qa: {
      user: 'deploy',
      host: 'your-qa-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/teamcast-backend.git',
      path: '/var/www/teamcast-backend-qa',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env qa',
      'pre-setup': '',
    },
  },
};
