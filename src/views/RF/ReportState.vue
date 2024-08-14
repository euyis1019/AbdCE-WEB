<template>
  <div class="report-state">
    <h1>申报进度查询</h1>
    <el-card v-loading="loading" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>申报进度</span>
          <el-button type="primary" @click="refreshStatus" icon="Refresh">刷新</el-button>
        </div>
      </template>
      <div v-if="reportItems.length > 0">
        <div v-for="(category, categoryIndex) in categories" :key="category.value" class="category-progress">
          <h3>{{ category.label }}</h3>
          <div v-for="(item, itemIndex) in getCategoryItems(category.value)" :key="`${category.value}-${itemIndex}`" class="report-item">
            <div class="item-header">
              <span class="item-title">{{ item.categoryCode }}</span>
              <el-tag :type="getStatusType(item.status)">{{ getStatusLabel(item.status) }}</el-tag>
            </div>
            <el-progress 
              :percentage="getProgressPercentage(item.status)" 
              :status="getProgressStatus(item.status)"
              :stroke-width="10"
              class="item-progress"
            ></el-progress>
            <p class="item-update"><strong>最后更新：</strong>{{ formatDate(item.submitTime) }}</p>
            <el-divider v-if="itemIndex < getCategoryItems(category.value).length - 1"></el-divider>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无申报记录"></el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from '../../http-common'
import authService from '../../services/authService'

const loading = ref(false)
const reportItems = ref([])

const categories = [
  { label: '思想品德', value: 'morality' },
  { label: '学业发展', value: 'academic' },
  { label: '身心健康', value: 'physical' },
  { label: '艺术素养', value: 'art' },
  { label: '社会实践', value: 'social' }
]

onMounted(() => {
  fetchReportStatus()
})

const fetchReportStatus = async () => {
  loading.value = true
  try {
    // 获取当前用户信息
    const user = authService.getCurrentUser() 
    // 如果用户未登录
    if (!user) { 
      // 抛出错误
      throw new Error('用户未登录'); 
    }

    // 获取申报进度
    const response = await axios.get('/report/progress', { 
      params: {
        userID: user.ID // 使用当前用户的 ID
      }
    });
    // 如果请求成功
    if (response.data.statusID === 1) { 
      // 设置申报项目数据
      reportItems.value = response.data.data; 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理获取申报状态失败的错误
    console.error('获取申报状态失败:', error); 
    ElMessage.error('获取申报状态失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

const refreshStatus = () => {
  fetchReportStatus(); // 刷新申报状态
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
}

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

const getStatusType = (status: string) => {
  const statusTypeMap = {
    'pending': 'info',
    'reviewing': 'warning',
    'cross_review': 'warning',
    'grade_review': 'warning',
    'confirmed': 'success'
  };
  return statusTypeMap[status] || 'info';
}

const getProgressPercentage = (status: string) => {
  const percentageMap = {
    'pending': 20,
    'reviewing': 40,
    'cross_review': 60,
    'grade_review': 80,
    'confirmed': 100
  };
  return percentageMap[status] || 0;
}

const getProgressStatus = (status: string) => {
  return status === 'confirmed' ? 'success' : '';
}

const getCategoryItems = (category: string) => {
  return reportItems.value.filter(item => item.categoryCode.startsWith(category));
}

</script>

<style scoped>
.report-state {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-progress {
  margin-bottom: 30px;
}

.report-item {
  margin-bottom: 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-title {
  font-weight: bold;
}

.item-progress {
  margin: 10px 0;
}

.item-update {
  font-size: 0.9em;
  color: #606266;
}

@media (max-width: 768px) {
  .report-state {
    padding: 10px;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-title {
    margin-bottom: 5px;
  }
}
</style>