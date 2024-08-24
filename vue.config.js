const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  runtimeCompiler: true, 
  devServer: {
    host: 'localhost',
    port: 80,
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
