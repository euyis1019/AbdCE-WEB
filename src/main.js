import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'


// main.ts完整引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(ElementPlus)
app.use(ElementPlus, { size: 'small', zIndex: 3000 })

app.mount('#app')

createApp(App).use(store).use(router).mount('#app')

