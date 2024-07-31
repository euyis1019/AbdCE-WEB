import { createRouter, createWebHistory } from 'vue-router'
import MainBox from '../views/MainBox.vue'
import ReportForm from '../views/RF/ReportForm.vue'
import ReportState from '../views/RF/ReportState.vue'
import NotFound from '../views/Notfound/NotFound.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../LoginRegister/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../LoginRegister/Register.vue')
  },
  {
    path: '/',
    component: MainBox,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/HomeView.vue')
      },
      {
        path: 'report',
        name: 'ReportForm',
        component: ReportForm
      },
      {
        path: 'state',
        name: 'ReportState',
        component: ReportState
      },
      {
        path: 'audit',
        name: 'AuditProcess',
        component: () => import('../views/admin.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token')
  if (to.name !== 'Login' && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresAdmin) {
    const userRole = localStorage.getItem('userRole')
    if (userRole === 'admin') {
      next()
    } else {
      next({ name: 'Home' })
    }
  } else {
    next()
  }
})

export default router