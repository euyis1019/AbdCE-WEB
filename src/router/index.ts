import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainBox from '../views/MainBox.vue'
import HomeView from '../views/HomeView.vue'
import ReportForm from '../views/RF/ReportForm.vue'
import ReportState from '../views/RF/ReportState.vue'
import AdminTodo from '../views/admin/AdminTodo.vue'
import PermissionManagement from '../views/PermissionManagement.vue'
import Profile from '../views/Profile.vue'
import NotFound from '../views/Notfound/NotFound.vue'
import ImmersiveReview from '../views/ImmersiveReview.vue'
import DataDashboard from '../views/DataDashboard.vue'
import ReviewManagement from '../views/ReviewManagement.vue'
import Login from '../LoginRegister/Login.vue'
import Register from '../LoginRegister/Register.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
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
        component: ReportForm
      },
      {
        path: 'state',
        name: 'ReportState',
        component: ReportState
      },
      {
        path: 'admin/todo',
        name: 'AdminTodo',
        component: AdminTodo,
        meta: { requiresReviewer: true }
      },
      {
        path: 'permission-management',
        name: 'PermissionManagement',
        component: PermissionManagement,
        meta: { requiresAdmin: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'immersive-review',
        name: 'ImmersiveReview',
        component: ImmersiveReview,
        meta: { requiresReviewer: true }
      },
      {
        path: 'data-dashboard',
        name: 'DataDashboard',
        component: DataDashboard,
        meta: { requiresAdmin: true }
      },
      {
        path: 'review-management',
        name: 'ReviewManagement',
        component: ReviewManagement,
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
  const userRole = localStorage.getItem('Permission')

  if (to.name !== 'Login' && to.name !== 'Register' && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresAdmin && userRole !== '3') {
    next({ name: 'Home' })
  } else if (to.meta.requiresReviewer && !['1', '2', '3'].includes(userRole || '')) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router