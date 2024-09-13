<template>
  <div class="home">
    <h1 class="welcome-title">
      {{ currentUser ? currentUser.Name : '陌生人' }}，欢迎使用综合素质信息评价填报系统
      <el-tag :type="userRoleColor" effect="dark">{{ userRoleName }}</el-tag>
    </h1>
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
            <p><strong>年级：</strong>{{ userInfo.grade }}</p>
            <p><strong>专业班级：</strong>{{ userInfo.majorClass }}</p>
            <p><strong>角色：</strong>{{ userRoleName }}</p>
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
                <!-- 新增：显示需要确认或修改的材料 -->
                <el-alert
                  v-if="reportStatus.needsConfirmation"
                  title="您有材料需要确认"
                  type="warning"
                  :closable="false"
                  show-icon
                >
                  <el-button size="small" type="primary" @click="goToReportState">查看详情</el-button>
                </el-alert>
                <el-alert
                  v-if="reportStatus.needsModification"
                  title="您有材料需要修改"
                  type="error"
                  :closable="false"
                  show-icon
                >
                  <el-button size="small" type="primary" @click="goToReportState">查看详情</el-button>
                </el-alert>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import { useRouter } from 'vue-router'
import { EditPen, InfoFilled, View, Tickets, Check, Document, Bell, DataLine } from '@element-plus/icons-vue'
import Statistic from '../components/Statistic.vue'
import authService from '../services/authService'
import axios from '../http-common'

const router = useRouter();
const currentUser = ref(null)
const userStatus = ref(null)
const userRoleName = ref('普通用户')
const userRoleColor = ref('success')
const permissionLevel = ref(0)
const categoryTreeRef = ref<InstanceType<typeof ElTree>>()
const categoryTree = ref([])
const userPermissions = ref([])
const assignDialogVisible = ref(false)
const removeConfirmDialogVisible = ref(false)
const autoAssigning = ref(false)
const assignForm = ref({
  categoryId: '',
  categoryName: '',
  reviewerId: ''
})
const assignedReviewers = ref({})

const UserInfo = {
  name: '',
  studentId: '',
  grade: '',
  majorClass: '',
  avatar: '',
  role: ''
}

const ReportStatus = {
  progress: 0,
  status: '',
  lastUpdate: 0,
  needsConfirmation: false,
  needsModification: false
}

const userInfo = ref<typeof UserInfo | null>(null); 
const reportStatus = ref<typeof ReportStatus | null>(null);
const isReviewer = ref(false);
const isAdmin = ref(false);

const loading = computed(() => ({
  user: false,
  report: false,
  stats: false
}));

const error = computed(() => ({
  user: '',
  report: '',
  stats: ''
})); 

const stats = computed(() => ({
  pendingReports: 0,
  completedReviews: 0,
  myReports: 0,
  announcements: 0
})); 

const availableReviewers = computed(() => {
  const currentReviewers = assignedReviewers.value[assignForm.value.categoryId] || []
  return userPermissions.value.filter(user => 
    user.level > 0 && user.level < 30 && !currentReviewers.includes(user.id)
  )
})

const fetchDashboardData = async () => {
  loading.value.user = true;
  loading.value.report = true;
  loading.value.stats = true;
  error.value.user = '';
  error.value.report = '';
  error.value.stats = '';

  try {
    const user = authService.getCurrentUser();
    if (user) {
      permissionLevel.value = await authService.checkUserPermission();
      userRoleName.value = authService.getUserRoleName(permissionLevel.value);
      userRoleColor.value = authService.getUserRoleColor(permissionLevel.value);

      userInfo.value = {
        name: user.Name || '',
        studentId: user.StudentId || '',
        grade: user.grade || '',
        majorClass: user.major_class || '',
        avatar: '',
        role: userRoleName.value
      };

      const statusResponse = await axios.post('/record/userstatus', { userID: user.StudentId });
      if (statusResponse.data.statusID === 1) {
        userStatus.value = statusResponse.data;
        stats.value.pendingReports = statusResponse.data.reviewTodoCount;
        stats.value.completedReviews = statusResponse.data.finalDoneCount;
        stats.value.myReports = statusResponse.data.reviewTodoCount + statusResponse.data.reviewDoneCount + 
                          statusResponse.data.finalTodoCount + statusResponse.data.finalDoneCount;
        
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
              lastUpdate: new Date().getTime(),
              needsConfirmation: fileStatusResponse.data.status === '初审通过',
              needsModification: fileStatusResponse.data.status === '初审未通过'
            };
          }
        } else {
          reportStatus.value = null;
        }
      } else {
        throw new Error(statusResponse.data.msg);
      }

      stats.value.announcements = 0;
    } else {
      throw new Error('未找到用户信息');
    }
  } catch (err) {
    console.error('获取仪表盘数据失败:', err);
    error.value.user = '加载用户信息失败';
    error.value.report = '加载申报状态失败';
    error.value.stats = '加载统计数据失败';
  } finally {
    loading.value.user = false;
    loading.value.report = false;
    loading.value.stats = false;
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

onMounted(async () => {
  await fetchDashboardData();
  currentUser.value = authService.getCurrentUser();
  if (currentUser.value && currentUser.value.ID) {
    isReviewer.value = permissionLevel.value > 0;
    isAdmin.value = permissionLevel.value >= 30;
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

.el-alert {
  margin-top: 10px;
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
