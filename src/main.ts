import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
 
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
//按照VUE3的方式去注册！
//本地能运行再commit
app
.use(ElementPlus)
.use(store)
.use(router)
.component('QuillEditor', QuillEditor)
.mount('#app')