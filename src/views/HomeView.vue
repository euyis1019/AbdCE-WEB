<template>
  <div class="home">
    <h1 class="welcome-title">欢迎使用综合评价信息申报系统</h1>
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
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
          <!-- 申报状态卡片 -->
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
          <!-- 快速操作卡片 -->
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
        <!-- 统计数据卡片 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, InfoFilled, View, Tickets, Check, Document, Bell, DataLine } from '@element-plus/icons-vue'
import Statistic from '../components/Statistic.vue'
import axios from 'axios'

const router = useRouter()

// 定义用户信息接口
interface UserInfo {
  name: string;
  studentId: string;
  class: string;
  avatar: string;
  role: string;
}

// 定义申报状态接口
interface ReportStatus {
  progress: number;
  status: string;
  lastUpdate: string;
}

// 用户信息和申报状态的响应式引用
const userInfo = ref<UserInfo | null>(null)
const reportStatus = ref<ReportStatus | null>(null)
const isReviewer = ref(false)
const isAdmin = ref(false)

// 加载状态和错误信息
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

// 统计数据
const stats = reactive({
  pendingReports: 0,
  completedReviews: 0,
  myReports: 0,
  announcements: 0
})

// 获取仪表盘数据
const fetchDashboardData = async () => {
  loading.user = true
  loading.report = true
  loading.stats = true
  error.user = ''
  error.report = ''
  error.stats = ''

  try {
    const token = localStorage.getItem('token')
    const userID = localStorage.getItem('ID')

    // 获取用户信息
    userInfo.value = {
      name: localStorage.getItem('userName') || '',
      studentId: userID || '',
      class: localStorage.getItem('Class') || '',
      avatar: '',
      role: localStorage.getItem('Permission') || '0'
    }

    // 获取申报状态
    const reportResponse = await axios.get('/report/progress', {
      params: {
        t: token,
        userID: userID
      }
    })
    if (reportResponse.data.statusID === 1) {
      const latestReport = reportResponse.data.data[reportResponse.data.data.length - 1]
      reportStatus.value = {
        progress: getProgressPercentage(latestReport.status),
        status: getStatusLabel(latestReport.status),
        lastUpdate: latestReport.submitTime
      }
    }

    // 获取统计数据
    // 注意：后端目前没有提供这个接口，这里使用模拟数据
    stats.pendingReports = 0
    stats.completedReviews = 0
    stats.myReports = reportResponse.data.data.length
    stats.announcements = 0

  } catch (err) {
    console.error('获取仪表盘数据失败:', err)
    error.user = '加载用户信息失败'
    error.report = '加载申报状态失败'
    error.stats = '加载统计数据失败'
  } finally {
    loading.user = false
    loading.report = false
    loading.stats = false
  }
}

// 刷新申报状态
const refreshReportStatus = () => {
  fetchDashboardData()
  ElMessage.success('正在刷新申报状态')
}

// 格式化进度条显示
const formatProgress = (percentage: number) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

// 获取进度条状态
const getProgressStatus = () => {
  if (!reportStatus.value) return ''
  if (reportStatus.value.progress === 100) return 'success'
  if (reportStatus.value.progress > 50) return 'exception'
  return 'warning'
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取角色名称
const getRoleName = (role: string) => {
  switch (role) {
    case '3':
      return '管理员'
    case '2':
      return '级委'
    case '1':
      return '班委'
    default:
      return '学生'
  }
}

// 页面跳转函数
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

// 获取进度百分比
const getProgressPercentage = (status: string) => {
  const percentageMap = {
    'pending': 20,
    'reviewing': 40,
    'cross_review': 60,
    'grade_review': 80,
    'confirmed': 100
  }
  return percentageMap[status] || 0
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap = {
    'pending': '待审核',
    'reviewing': '班委初审中',
    'cross_review': '交叉复审中',
    'grade_review': '级委审核中',
    'confirmed': '已确认'
  }
  return statusMap[status] || '未知状态'
}

// 组件挂载时获取数据
onMounted(() => {
  fetchDashboardData()
  const permission = localStorage.getItem('Permission')
  isReviewer.value = permission === '1' || permission === '2'
  isAdmin.value = permission === '3'
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