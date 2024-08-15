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
import authService from '../services/authService'; // 引入 authService

// 定义路由规则
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: Login // 登录组件
  },
  {
    path: '/register',
    name: 'Register',
    component: Register // 注册组件
  },
  {
    path: '/',
    component: MainBox, // 主布局组件
    children: [
      {
        path: '',
        name: 'Home',
        component: HomeView // 首页组件
      },
      {
        path: 'report',
        name: 'ReportForm',
        component: ReportForm, // 申报填写组件
        meta: { requiresAuth: true } // 需要身份验证
      },
      {
        path: 'state',
        name: 'ReportState',
        component: ReportState, // 进度查询组件
        meta: { requiresAuth: true } // 需要身份验证
      },
      {
        path: 'admin/todo',
        name: 'AdminTodo',
        component: AdminTodo, // 审核员待办事项组件
        meta: { requiresAuth: true, requiresReviewer: true } // 需要身份验证和审核员权限
      },
      {
        path: 'permission-management',
        name: 'PermissionManagement',
        component: PermissionManagement, // 权限管理组件
        meta: { requiresAuth: true, requiresAdmin: true } // 需要身份验证和管理员权限
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile, // 个人信息组件
        meta: { requiresAuth: true } // 需要身份验证
      },
      {
        path: 'immersive-review',
        name: 'ImmersiveReview',
        component: ImmersiveReview, // 沉浸式审核组件
        meta: { requiresAuth: true, requiresReviewer: true } // 需要身份验证和审核员权限
      },
      {
        path: 'data-dashboard',
        name: 'DataDashboard',
        component: DataDashboard, // 数据看板组件
        meta: { requiresAuth: true, requiresAdmin: true } // 需要身份验证和管理员权限
      },
      {
        path: 'review-management',
        name: 'ReviewManagement',
        component: ReviewManagement, // 复审管理组件
        meta: { requiresAuth: true, requiresAdmin: true } // 需要身份验证和管理员权限
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound // 404 页面组件
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
  const user = authService.getCurrentUser();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresReviewer = to.matched.some(record => record.meta.requiresReviewer);

  if (requiresAuth && !user) {
    next({ name: 'Login' });
  } else if (requiresAdmin && user?.Permission !== '3') {
    next({ name: 'Home' });
  } else if (requiresReviewer && !['1', '2', '3'].includes(user?.Permission || '')) {
    next({ name: 'Home' });
  } else {
    if (user && to.path === '/login') {
      next({ name: 'Home' });
    } else {
      next();
    }
  }
})

export default router