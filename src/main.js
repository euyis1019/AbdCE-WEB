import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
<<<<<<< HEAD


import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'


const app = createApp(App)

// app.use(ElementPlus, { size: 'small', zIndex: 3000 })
// app.mount('#app')
// app.use(store)
// app.use(router)

createApp(App).use(store).use(router).use(ElementPlus).mount('#app')
=======
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Particles from "particles.vue3"
import VueQuillEditor from 'vue-quill-editor' // import rich text editor
import "quill/dist/quill.core.css" 
import "quill/dist/quill.snow.css" 
import "quill/dist/quill.bubble.css"; 

Vue.use(VueQuillEditor)
createApp(App)
.use(Particles)
.use(ElementPlus)
.use(store)
.use(router)
.mount('#app')
>>>>>>> 72880bef85b562ecd0cba657eadb97c22e6dc6aa
