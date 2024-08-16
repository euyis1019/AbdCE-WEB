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
import APITestComponent from '../views/APITestComponent.vue'

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
        component: AdminTodo
      },
      {
        path: 'permission-management',
        name: 'PermissionManagement',
        component: PermissionManagement
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'immersive-review',
        name: 'ImmersiveReview',
        component: ImmersiveReview
      },
      {
        path: 'data-dashboard',
        name: 'DataDashboard',
        component: DataDashboard
      },
      {
        path: 'review-management',
        name: 'ReviewManagement',
        component: ReviewManagement
      },
      {
        path: 'api-test',
        name: 'APITest',
        component: APITestComponent
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

export default router