// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'nest-app',
      script: 'dist/src/main.js',
      instances: 'max',              // 使用所有CPU核心
      exec_mode: 'cluster',          // 集群模式
      watch: false,                  // 生产环境关闭文件监听
      max_memory_restart: '1G',      // 内存超过1G自动重启
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};
