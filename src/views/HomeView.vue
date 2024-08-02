<template>
  <div class="home">
    <h1 class="welcome-title">欢迎使用综合评价信息申报系统</h1>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="6">
        <el-card class="info-card user-info" shadow="hover" v-loading="loading.user">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          <div v-if="userInfo" class="info-content">
            <el-avatar :size="64" :src="userInfo.avatar">{{ userInfo.name?.charAt(0) }}</el-avatar>
            <p><strong>姓名：</strong>{{ userInfo.name }}</p>
            <p><strong>学号：</strong>{{ userInfo.studentId }}</p>
            <p><strong>班级：</strong>{{ userInfo.class }}</p>
            <p><strong>角色：</strong>{{ getRoleName(userInfo.role) }}</p>
          </div>
          <el-alert v-if="error.user" :title="error.user" type="error" :closable="false" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="18">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="12">
            <el-card class="info-card report-status" shadow="hover" v-loading="loading.report">
              <template #header>
                <div class="card-header">
                  <span>申报状态</span>
                  <el-button class="button" text @click="refreshReportStatus">刷新</el-button>
                </div>
              </template>
              <div v-if="reportStatus" class="info-content">
                <el-progress :percentage="reportStatus.progress" :format="formatProgress" :status="getProgressStatus()"></el-progress>
                <p><strong>当前状态：</strong>{{ reportStatus.status }}</p>
                <p><strong>最后更新：</strong>{{ formatDate(reportStatus.lastUpdate) }}</p>
              </div>
              <el-alert v-if="error.report" :title="error.report" type="error" :closable="false" />
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12">
            <el-card class="info-card quick-actions" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>快速操作</span>
                </div>
              </template>
              <div class="button-group">
                <el-button type="primary" icon="EditPen" @click="goToReportForm" :disabled="loading.report">填写申报</el-button>
                <el-button type="info" icon="InfoFilled" @click="goToReportState" :disabled="loading.report">查看进度</el-button>
                <el-button v-if="isReviewer || isAdmin" type="success" icon="View" @click="goToReviewTasks">审核任务</el-button>
                <el-button v-if="isAdmin" type="warning" icon="DataLine" @click="goToDataDashboard">数据看板</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="stats-row">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stats-card" shadow="hover">
              <statistic title="待审核申报" :value="stats.pendingReports" icon="Tickets" />
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stats-card" shadow="hover">
              <statistic title="已完成审核" :value="stats.completedReviews" icon="Check" />
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stats-card" shadow="hover">
              <statistic title="我的申报" :value="stats.myReports" icon="Document" />
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stats-card" shadow="hover">
              <statistic title="系统公告" :value="stats.announcements" icon="Bell" />
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="announcement-row">
      <el-col :span="24">
        <el-card class="announcement-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>系统公告</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="activity.timestamp"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, InfoFilled, View, Tickets, Check, Document, Bell, DataLine } from '@element-plus/icons-vue'
import Statistic from '../components/Statistic.vue'

const router = useRouter()

interface UserInfo {
  name: string;
  studentId: string;
  class: string;
  avatar: string;
  role: string;
}

interface ReportStatus {
  progress: number;
  status: string;
  lastUpdate: string;
}

const userInfo = ref<UserInfo | null>(null)
const reportStatus = ref<ReportStatus | null>(null)
const isReviewer = ref(false)
const isAdmin = ref(false)

const loading = reactive({
  user: false,
  report: false,
  stats: false
})

const error = reactive({
  user: '',
  report: '',
  stats: ''
})

const stats = reactive({
  pendingReports: 0,
  completedReviews: 0,
  myReports: 0,
  announcements: 0
})

const activities = ref([
  { content: '系统将于本周日进行维护升级', timestamp: '2023-05-10 20:46', type: 'warning' },
  { content: '新版本功能上线公告', timestamp: '2023-05-09 09:30', type: 'success' },
  { content: '请及时提交本学期综合评价申报', timestamp: '2023-05-08 14:20', type: 'info' },
])

const fetchDashboardData = async () => {
  loading.user = true
  loading.report = true
  loading.stats = true
  error.user = ''
  error.report = ''
  error.stats = ''

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // User Info
    userInfo.value = {
      name: '张三',
      studentId: '20223800001',
      class: '软件工程2班',
      avatar: '',
      role: localStorage.getItem('userRole') || 'user'
    }

    // Report Status
    reportStatus.value = {
      progress: 60,
      status: '班委初审中',
      lastUpdate: new Date().toISOString()
    }

    // Stats
    stats.pendingReports = Math.floor(Math.random() * 20)
    stats.completedReviews = Math.floor(Math.random() * 50)
    stats.myReports = Math.floor(Math.random() * 5)
    stats.announcements = activities.value.length

    // 实际的API调用可能如下：
    // const response = await axios.get('/api/dashboard', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   userInfo.value = response.data.userInfo
    //   reportStatus.value = response.data.reportStatus
    //   stats.pendingReports = response.data.stats.pendingReports
    //   stats.completedReviews = response.data.stats.completedReviews
    //   stats.myReports = response.data.stats.myReports
    //   stats.announcements = response.data.stats.announcements
    //   activities.value = response.data.activities
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    error.user = '加载用户信息失败'
    error.report = '加载申报状态失败'
    error.stats = '加载统计数据失败'
  } finally {
    loading.user = false
    loading.report = false
    loading.stats = false
  }
}

const refreshReportStatus = () => {
  fetchDashboardData()
  ElMessage.success('正在刷新申报状态')
}

const formatProgress = (percentage: number) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

const getProgressStatus = () => {
  if (!reportStatus.value) return ''
  if (reportStatus.value.progress === 100) return 'success'
  if (reportStatus.value.progress > 50) return 'exception'
  return 'warning'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getRoleName = (role: string) => {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'reviewer':
      return '审核员'
    default:
      return '学生'
  }
}

const goToReportForm = () => {
  router.push('/report')
}

const goToReportState = () => {
  router.push('/state')
}

const goToReviewTasks = () => {
  router.push('/admin/todo')
}

const goToDataDashboard = () => {
  router.push('/data-dashboard')
}

onMounted(() => {
  fetchDashboardData()
  isReviewer.value = localStorage.getItem('userRole') === 'reviewer'
  isAdmin.value = localStorage.getItem('userRole') === 'admin'
})
</script>

<style scoped>
.home {
  padding: 20px;
}

.welcome-title {
  text-align: center;
  margin-bottom: 30px;
  color: #409EFF;
  font-size: 28px;
}

.info-card {
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  text-align: center;
}

.el-avatar {
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stats-row {
  margin-top: 20px;
}

.stats-card {
  text-align: center;
}

.announcement-row {
  margin-top: 20px;
}

.announcement-card {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .home {
    padding: 10px;
  }
  
  .welcome-title {
    font-size: 24px;
  }

  .el-button {
    width: 100%;
  }

  .stats-card {
    margin-bottom: 15px;
  }
}
</style>