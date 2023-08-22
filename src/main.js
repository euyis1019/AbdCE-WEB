import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Particles from "particles.vue3"
import VueQuillEditor from 'vue-quill-editor' // import rich text editor
import "quill/dist/quill.core.css"
import "quill/dist/quill.snow.css"
import "quill/dist/quill.bubble.css";

Vue.use(VueQuillEditor)
import Particles from "particles.vue3";
//按照VUE3的方式去注册！
//本地能运行再commit
createApp(App)
    .use(Particles)
    .use(ElementPlus)
    .use(store)
    .use(router)
    .mount('#app')