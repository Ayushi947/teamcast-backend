module.exports = {
  apps: [
    {
      name: 'teamcast-backend',
      script: './dist/src/index.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 4300,
        ENV_NAME: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4300,
        ENV_NAME: 'production',
      },
      env_qa: {
        NODE_ENV: 'qa',
        PORT: 4300,
        ENV_NAME: 'qa',
      },
      // PM2 specific configurations
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'tmp'],
      max_memory_restart: '8G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 8000,

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

      // Environment variables
      env_file: '.env',
    },
  ],
};
