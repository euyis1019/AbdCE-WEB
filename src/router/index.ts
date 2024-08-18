import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainBox from '../views/MainBox.vue'
import HomeView from '../views/HomeView.vue'
import ReportForm from '../views/RF/ReportForm.vue'
import ReportState from '../views/RF/ReportState.vue'
import AdminTodo from '../views/admin/AdminTodo.vue'
import PermissionManagement from '../views/PermissionManagement.vue'
import NotFound from '../views/Notfound/NotFound.vue'
import ImmersiveReview from '../views/ImmersiveReview.vue'
import ReviewManagement from '../views/ReviewManagement.vue'
import authService from '../services/authService'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainBox,
    children: [
      {
        path: '',
        name: 'Home',
        component: HomeView
      },
      {
        path: 'report',
        name: 'ReportForm',
        component: ReportForm,
        meta: { requiresAuth: true }
      },
      {
        path: 'state',
        name: 'ReportState',
        component: ReportState,
        meta: { requiresAuth: true }
      },
      {
        path: 'admin/todo',
        name: 'AdminTodo',
        component: AdminTodo,
        meta: { requiresAuth: true, requiresReviewer: true }
      },
      {
        path: 'permission-management',
        name: 'PermissionManagement',
        component: PermissionManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'immersive-review',
        name: 'ImmersiveReview',
        component: ImmersiveReview,
        meta: { requiresAuth: true, requiresReviewer: true }
      },
      {
        path: 'review-management',
        name: 'ReviewManagement',
        component: ReviewManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
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

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('jwt_token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const requiresReviewer = to.matched.some(record => record.meta.requiresReviewer)

  if (requiresAuth && !token) {
    // 重定向到SSO登录页面
    window.location.href = process.env.VUE_APP_SSO_URL + 'index/login.html'
    return
  }

  if (token) {
    const isValid = await authService.verifyToken(token)
    if (!isValid) {
      // 令牌无效,重定向到SSO登录页面
      window.location.href = process.env.VUE_APP_SSO_URL + 'index/login.html'
      return
    }

    const user = authService.getCurrentUser()
    if (requiresAdmin && user?.Permission !== '3') {
      next({ name: 'Home' })
    } else if (requiresReviewer && !['1', '2', '3'].includes(user?.Permission || '')) {
      next({ name: 'Home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router