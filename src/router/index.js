import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import mainbox from '../views/MainBox.vue'
import admin from '../views/admin.vue'
import apply from '../views/apply.vue'
import record from '../views/record.vue'
import RoutesConfig from './config.js'
import store from "../store/index"

const routes = [
  {
    path: "/login",
    name: "login",
    component: Login
  },
  {
    path: "/mainbox",
    name: "mainbox",
    component: mainbox
  },
  {
    path: "/admin",
    name: "admin",
    component: admin
  },
  {
    path: "/apply",
    name: "apply",
    component: apply
  },
  {
    path: "/record",
    name: "record",
    component: record
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
//路由拦截
router.beforeEach((to, from, next) => {
  if (to.name === 'login') {
    next()
  } else {
    //是否授权
    if (!localStorage.getItem("token")) {
      next({
        path: "/login"
      })
    } else {
      //后期拓展很多页面的话用config.js配置循环路由
      //ConfigRouter()直接配置会死循环
      if (!store.state.isGetterRouter) {
        ConfigRouter()
        next({
          path: to.fullPath
        })
      }
      else {
        next()
      }
    }
  }
})


const ConfigRouter = () => {
  RoutesConfig.forEach(item => {
    router.addRoute("mainbox", item)
  })

  store.commit("changeGetterRouter", true)
}
/*router.addRoute("mainBox",{
  path:"/Report",
  component:ReportForm
})
router.addRoute("mainBox",{
  path:"/Record",
  component:ApplicationRecord
})*/
export default router
