const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  runtimeCompiler: true, 
  devServer: {
    host: 'cesys.abdn.kirisame.cc',
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
      'localhost',
      'cesys-abdn.ygxz.xyz',
      'cesys.abdn.kirisame.cc',
    ]
  }
});
