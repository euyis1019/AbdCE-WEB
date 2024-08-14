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