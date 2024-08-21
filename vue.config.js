const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: 'localhost', // 或者使用 '0.0.0.0'
    port: 80, // 使用更高的端口号，比如 8080
    https: false,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    allowedHosts: [
      'cesys.abdn.kirisame.cc',
    ]
  }
});
