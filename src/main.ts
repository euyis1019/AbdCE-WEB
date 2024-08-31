import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import './assets/global.css';
import axios from './http-common'; // 引入 axios 实例
import authService from './services/authService'; // 引入 authService

const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err: any, vm: any, info: any) => {
  // 检查是否为 ResizeObserver 相关错误
  if (err.message === 'ResizeObserver loop limit exceeded' || 
      err.message === 'ResizeObserver loop completed with undelivered notifications.') {
    // 忽略 ResizeObserver 错误
    console.warn('ResizeObserver error ignored:', err.message);
    return;
  }
  
  // 处理其他错误
  console.error('Global error:', err);
  console.error('Vue component:', vm);
  console.error('Error info:', info);
};

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 创建 Pinia 实例
const pinia = createPinia();

// 使用 Pinia、路由和 Element Plus
app.use(pinia);
app.use(router);
app.use(ElementPlus);

// 全局配置 axios 和 authService
app.config.globalProperties.$axios = axios;
app.config.globalProperties.$auth = authService;

// 挂载应用
app.mount('#app');

// 添加未捕获的 Promise 拒绝处理器
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});
