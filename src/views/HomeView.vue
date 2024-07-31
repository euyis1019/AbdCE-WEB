<template>
  <div class="home">
    <h1 class="welcome-title">欢迎使用综合评价信息申报系统</h1>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="info-card user-info" shadow="hover" v-loading="loading.user">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          <div v-if="userInfo" class="info-content">
            <el-avatar :size="64" :src="userInfo.avatar">{{ userInfo.name.charAt(0) }}</el-avatar>
            <p><strong>姓名：</strong>{{ userInfo.name }}</p>
            <p><strong>学号：</strong>{{ userInfo.studentId }}</p>
            <p><strong>班级：</strong>{{ userInfo.class }}</p>
          </div>
          <el-alert v-if="error.user" :title="error.user" type="error" :closable="false" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
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
      <el-col :xs="24" :sm="24" :md="8">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, InfoFilled, View, Tickets, Check, Document, Bell } from '@element-plus/icons-vue'
import Statistic from '../components/Statistic.vue'

const router = useRouter()

interface UserInfo {
  name: string;
  studentId: string;
  class: string;
  avatar: string;
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
  report: false
})

const error = reactive({
  user: '',
  report: ''
})

const stats = reactive({
  pendingReports: 0,
  completedReviews: 0,
  myReports: 0,
  announcements: 0
})

const fetchUserInfo = async () => {
  loading.user = true
  error.user = ''
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    userInfo.value = {
      name: '张三',
      studentId: '20223800001',
      class: '软件工程2班',
      avatar: ''
    }

    // 实际的API调用可能如下：
    // const response = await axios.get('/api/user-info', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   userInfo.value = {
    //     name: response.data.data.name,
    //     studentId: response.data.data.ID,
    //     class: response.data.data.class,
    //     avatar: response.data.data.avatar
    //   }
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (err) {
    console.error('Error fetching user info:', err)
    error.user = '加载用户信息失败'
  } finally {
    loading.user = false
  }
}

const fetchReportStatus = async () => {
  loading.report = true
  error.report = ''
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    reportStatus.value = {
      progress: 60,
      status: '班委初审中',
      lastUpdate: new Date().toISOString()
    }

    // 实际的API调用可能如下：
    // const response = await axios.get('/report/progress', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 1) {
    //   const latestReport = response.data.data[response.data.data.length - 1]
    //   reportStatus.value = {
    //     progress: calculateProgress(latestReport.status),
    //     status: getStatusDescription(latestReport.status),
    //     lastUpdate: new Date(latestReport.submitTime * 1000).toISOString()
    //   }
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (err) {
    console.error('Error fetching report status:', err)
    error.report = '加载申报状态失败'
  } finally {
    loading.report = false
  }
}

const refreshReportStatus = () => {
  fetchReportStatus()
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

const goToReportForm = () => {
  router.push('/report')
}

const goToReportState = () => {
  router.push('/state')
}

const goToReviewTasks = () => {
  router.push('/admin/todo')
}

const fetchStats = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    stats.pendingReports = Math.floor(Math.random() * 20)
    stats.completedReviews = Math.floor(Math.random() * 50)
    stats.myReports = Math.floor(Math.random() * 5)
    stats.announcements = Math.floor(Math.random() * 3)

    // 实际的API调用可能如下：
    // const response = await axios.get('/api/stats', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   stats.pendingReports = response.data.pendingReports
    //   stats.completedReviews = response.data.completedReviews
    //   stats.myReports = response.data.myReports
    //   stats.announcements = response.data.announcements
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (err) {
    console.error('Error fetching stats:', err)
    ElMessage.error('获取统计数据失败')
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchReportStatus()
  fetchStats()
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