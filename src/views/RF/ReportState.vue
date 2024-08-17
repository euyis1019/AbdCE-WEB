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
        <div v-for="(item, index) in reportItems" :key="`${item.FileID}-${index}`" class="report-item">
          <div class="item-header">
            <CategoryInfo :categoryCode="item.categoryCode">
              <template #default="{ categoryData }">
                <span class="item-title">{{ categoryData ? categoryData.title : item.categoryCode }}</span>
              </template>
            </CategoryInfo>
            <el-tag :type="getStatusType(item.status)">{{ item.status }}</el-tag>
          </div>
          <el-progress 
            :percentage="getProgressPercentage(item.status)" 
            :status="getProgressStatus(item.status)"
            :stroke-width="10"
            class="item-progress"
          ></el-progress>
          <p class="item-update"><strong>最后更新：</strong>{{ formatDate(item.submitTime) }}</p>
          <el-divider v-if="index < reportItems.length - 1"></el-divider>
        </div>
      </div>
      <el-empty v-else description="暂无申报记录"></el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '../../http-common'
import authService from '../../services/authService'
import CategoryInfo from '../../components/CategoryInfo.vue'

const loading = ref(false)
const reportItems = ref([])

onMounted(() => {
  fetchReportStatus()
})

const fetchReportStatus = async () => {
  loading.value = true
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/admin/filestatus', {
      userID: user.ID
    })
    if (response.data.statusID === 1) {
      reportItems.value = response.data.files.map(file => ({
        ...file,
        status: getStatusLabel(file)
      }))
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取申报状态失败:', error)
    ElMessage.error('获取申报状态失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const refreshStatus = () => {
  fetchReportStatus()
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusLabel = (file: any) => {
  if (!file.isDone && !file.finalDone) return '待初审'
  if (file.isDone && !file.finalDone) return '初审通过'
  if (file.isDone && file.finalDone) return '终审通过'
  return '未知状态'
}

const getStatusType = (status: string) => {
  switch (status) {
    case '待初审':
      return 'warning'
    case '初审通过':
      return 'success'
    case '终审通过':
      return 'info'
    default:
      return 'info'
  }
}

const getProgressPercentage = (status: string) => {
  switch (status) {
    case '待初审':
      return 33
    case '初审通过':
      return 66
    case '终审通过':
      return 100
    default:
      return 0
  }
}

const getProgressStatus = (status: string) => {
  return status === '终审通过' ? 'success' : ''
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