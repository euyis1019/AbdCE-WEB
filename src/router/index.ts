import { createRouter, createWebHistory } from 'vue-router'
import MainBox from '../views/MainBox.vue'
import HomeView from '../views/HomeView.vue'
import ReportForm from '../views/RF/ReportForm.vue'
import ReportState from '../views/RF/ReportState.vue'
import AdminView from '../views/admin.vue'
import AdminHistory from '../views/admin/AdminHistory.vue'
import AdminTodo from '../views/admin/AdminTodo.vue'
import Profile from '../views/Profile.vue'
import Upload from '../views/Upload.vue'
import NotFound from '../views/Notfound/NotFound.vue'
import PermissionManagement from '../views/PermissionManagement.vue'
import ImmersiveReview from '../views/ImmersiveReview.vue'

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
        path: 'admin',
        name: 'AdminView',
        component: AdminView,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/history',
        name: 'AdminHistory',
        component: AdminHistory,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/todo',
        name: 'AdminTodo',
        component: AdminTodo,
        meta: { requiresAdmin: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'upload',
        name: 'Upload',
        component: Upload
      },
      {
        path: '/permission-management',
        name: 'PermissionManagement',
        component: PermissionManagement,
        meta: { requiresAdmin: true }
      },
      {
        path: '/immersive-review',
        name: 'ImmersiveReview',
        component: ImmersiveReview,
        meta: { requiresReviewer: true }
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
  const userRole = localStorage.getItem('userRole')

  if (to.name !== 'Login' && to.name !== 'Register' && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router