<template>
  <div class="home">
    <h1 class="welcome-title">{{ currentUser ? currentUser.Name : '陌生人' }}，欢迎使用综合信息评价填报系统</h1>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, InfoFilled, View, Tickets, Check, Document, Bell, DataLine } from '@element-plus/icons-vue'
import Statistic from '../components/Statistic.vue'
import authService from '../services/authService'
import axios from '../http-common'

const router = useRouter();
const currentUser = ref(null)
const userStatus = ref(null)

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
  lastUpdate: number;
}

const userInfo = ref<UserInfo | null>(null);
const reportStatus = ref<ReportStatus | null>(null);
const isReviewer = ref(false);
const isAdmin = ref(false);

const loading = reactive({
  user: false,
  report: false,
  stats: false
});

const error = reactive({
  user: '',
  report: '',
  stats: ''
});

const stats = reactive({
  pendingReports: 0,
  completedReviews: 0,
  myReports: 0,
  announcements: 0
});

const fetchDashboardData = async () => {
  loading.user = true;
  loading.report = true;
  loading.stats = true;
  error.user = '';
  error.report = '';
  error.stats = '';

  try {
    const user = authService.getCurrentUser();
    if (user) {
      userInfo.value = {
        name: user.Name || '',
        studentId: user.ID || '',
        class: user.Class || '',
        avatar: '',
        role: user.Permission || '0'
      };

      // 使用 /record/userstatus 接口获取用户统计数据
      const statusResponse = await axios.post('/record/userstatus', { userID: user.ID });
      if (statusResponse.data.statusID === 1) {
        userStatus.value = statusResponse.data;
        stats.pendingReports = statusResponse.data.reviewTodoCount;
        stats.completedReviews = statusResponse.data.finalDoneCount;
        stats.myReports = statusResponse.data.reviewTodoCount + statusResponse.data.reviewDoneCount + 
                          statusResponse.data.finalTodoCount + statusResponse.data.finalDoneCount;
        
        // 获取第一个 fileID 的状态（如果存在）
        const allFiles = [
          ...statusResponse.data.reviewTodoFiles,
          ...statusResponse.data.reviewDoneFiles,
          ...statusResponse.data.finalTodoFiles,
          ...statusResponse.data.finalDoneFiles
        ];
        
        if (allFiles.length > 0) {
          const fileStatusResponse = await axios.post('/record/filestatus', { FileID: allFiles[0] });
          if (fileStatusResponse.data.statusID === 1) {
            reportStatus.value = {
              progress: getProgressPercentage(fileStatusResponse.data.status),
              status: getStatusLabel(fileStatusResponse.data.status),
              lastUpdate: new Date().getTime() // 使用当前时间作为最后更新时间
            };
          }
        } else {
          reportStatus.value = null; // 没有申报记录
        }
      } else {
        throw new Error(statusResponse.data.msg);
      }

      // 系统公告数量（这里假设没有专门的接口，暂时设置为0）
      stats.announcements = 0;
    } else {
      throw new Error('未找到用户信息');
    }
  } catch (err) {
    console.error('获取仪表盘数据失败:', err);
    error.user = '加载用户信息失败';
    error.report = '加载申报状态失败';
    error.stats = '加载统计数据失败';
  } finally {
    loading.user = false;
    loading.report = false;
    loading.stats = false;
  }
};

const refreshReportStatus = () => {
  fetchDashboardData();
  ElMessage.success('正在刷新申报状态');
};

const formatProgress = (percentage: number) => {
  return percentage === 100 ? '完成' : `${percentage}%`;
};

const getProgressStatus = () => {
  if (!reportStatus.value) return '';
  if (reportStatus.value.progress === 100) return 'success';
  if (reportStatus.value.progress > 50) return 'exception';
  return 'warning';
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const getRoleName = (role: string) => {
  switch (role) {
    case '3':
      return '管理员';
    case '2':
      return '级委';
    case '1':
      return '班委';
    default:
      return '普通用户';
  }
};

const goToReportForm = () => {
  router.push('/report');
};

const goToReportState = () => {
  router.push('/state');
};

const goToReviewTasks = () => {
  router.push('/admin/todo');
};

const goToDataDashboard = () => {
  router.push('/data-dashboard');
};

const getProgressPercentage = (status: string) => {
  switch (status) {
    case '待初审':
      return 20;
    case '初审通过':
      return 60;
    case '终审通过':
      return 100;
    default:
      return 0;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case '待初审':
      return '待初审';
    case '初审通过':
      return '初审通过';
    case '终审通过':
      return '终审通过';
    default:
      return '未知状态';
  }
};

onMounted(() => {
  fetchDashboardData();
  currentUser.value = authService.getCurrentUser();
  if (currentUser.value && currentUser.value.ID) {
    isReviewer.value = ['1', '2'].includes(currentUser.value.Permission || '');
    isAdmin.value = currentUser.value.Permission === '3';
  }
});
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