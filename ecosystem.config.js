module.exports = {
  apps: [
    {
      name: 'telegram-prevent-spam-api',
      script: './src/app.js',
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      cron_restart: '1 0 * * *', //restart every day
    },
  ],
};
