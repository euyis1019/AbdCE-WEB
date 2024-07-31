<template>
  <div class="home">
    <h1>欢迎使用综合评价信息申报系统</h1>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="box-card" v-loading="loading.user">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button class="button" text @click="refreshUserInfo">刷新</el-button>
            </div>
          </template>
          <div v-if="userInfo" class="text item">
            <p><strong>姓名：</strong>{{ userInfo.name }}</p>
            <p><strong>学号：</strong>{{ userInfo.studentId }}</p>
            <p><strong>班级：</strong>{{ userInfo.class }}</p>
          </div>
          <el-alert v-if="error.user" :title="error.user" type="error" :closable="false" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="box-card" v-loading="loading.report">
          <template #header>
            <div class="card-header">
              <span>申报状态</span>
              <el-button class="button" text @click="refreshReportStatus">刷新</el-button>
            </div>
          </template>
          <div v-if="reportStatus" class="text item">
            <el-progress :percentage="reportStatus.progress" :format="formatProgress"></el-progress>
            <p><strong>当前状态：</strong>{{ reportStatus.status }}</p>
            <p><strong>最后更新：</strong>{{ formatDate(reportStatus.lastUpdate) }}</p>
          </div>
          <el-alert v-if="error.report" :title="error.report" type="error" :closable="false" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="text item">
            <el-button type="primary" @click="goToReportForm" :disabled="loading.report">填写申报</el-button>
            <el-button type="info" @click="goToReportState" :disabled="loading.report">查看进度</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

interface UserInfo {
  name: string;
  studentId: string;
  class: string;
}

interface ReportStatus {
  progress: number;
  status: string;
  lastUpdate: string;
}

const userInfo = ref<UserInfo | null>(null)
const reportStatus = ref<ReportStatus | null>(null)

const loading = reactive({
  user: false,
  report: false
})

const error = reactive({
  user: '',
  report: ''
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
      class: '软件工程2班'
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
    //     class: response.data.data.class
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

const refreshUserInfo = () => {
  fetchUserInfo()
  ElMessage.success('正在刷新用户信息')
}

const refreshReportStatus = () => {
  fetchReportStatus()
  ElMessage.success('正在刷新申报状态')
}

const formatProgress = (percentage: number) => {
  return percentage === 100 ? '完成' : `${percentage}%`
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

onMounted(() => {
  fetchUserInfo()
  fetchReportStatus()
})

// 辅助函数，实际使用时取消注释
// const calculateProgress = (status) => {
//   const statusMap = {
//     'pending': 20,
//     'reviewing': 60,
//     'approved': 100,
//     'rejected': 0
//   }
//   return statusMap[status] || 0
// }

// const getStatusDescription = (status) => {
//   const statusMap = {
//     'pending': '等待审核',
//     'reviewing': '审核中',
//     'approved': '审核通过',
//     'rejected': '审核未通过'
//   }
//   return statusMap[status] || '未知状态'
// }
</script>

<style scoped>
.home {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.el-row {
  margin-bottom: 20px;
}

.el-col {
  margin-bottom: 20px;
}

.el-button {
  margin-right: 10px;
}

@media (max-width: 768px) {
  .home {
    padding: 10px;
  }
  
  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }
}
</style>