module.exports = {
  apps: [
    {
      name: "CBS_MICRO_STAGING",
      script: "./node_modules/.bin/moleculer-runner",
      args: "--repl --hot services/**/*.service.js",
      // max_memory_restart: "400M", // cho mỗi process
      log_date_format: "YYYY-MM-DD HH:mm Z",
      watch: [
        "services",
        "tools",
        "moleculer.config.js"
      ],
      ignore_watch: [
        "node_modules",
        "logs",
        "*.log",
        "*.json"
      ],
      watch_options: {
        followSymlinks: false,
      },
      env_production: {
        "NODE_ENV": "production",
        "NEW_RELIC_NO_CONFIG_FILE": true
      },
      "node_args": ["--max_old_space_size=23552", "--max-semi-space-size=128", "-r", "newrelic"]
    }
  ],
};
