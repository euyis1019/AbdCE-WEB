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
              <span class="item-title">{{ item.title }}</span>
              <el-tag :type="getStatusType(item.status)">{{ getStatusLabel(item.status) }}</el-tag>
            </div>
            <el-progress 
              :percentage="getProgressPercentage(item.status)" 
              :status="getProgressStatus(item.status)"
              :stroke-width="10"
              class="item-progress"
            ></el-progress>
            <p class="item-update"><strong>最后更新：</strong>{{ formatDate(item.lastUpdate) }}</p>
            <el-divider v-if="itemIndex < getCategoryItems(category.value).length - 1"></el-divider>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无申报记录"></el-empty>
    </el-card>

    <el-dialog v-model="confirmDialogVisible" title="确认结果" width="30%">
      <p>您确定要确认当前的评价结果吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmResult">确认</el-button>
        </span>
      </template>
    </el-dialog>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const confirmDialogVisible = ref(false)
const objectionDialogVisible = ref(false)
const reportItems = ref([])

const objectionForm = ref({
  category: '',
  content: ''
})

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
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    reportItems.value = [
      { category: 'morality', title: '思想政治表现', status: 'pending', lastUpdate: Date.now() },
      { category: 'morality', title: '道德修养', status: 'reviewing', lastUpdate: Date.now() - 86400000 },
      { category: 'academic', title: '学习成绩', status: 'cross_review', lastUpdate: Date.now() - 172800000 },
      { category: 'academic', title: '学习能力', status: 'grade_review', lastUpdate: Date.now() - 259200000 },
      { category: 'physical', title: '体育锻炼', status: 'confirmed', lastUpdate: Date.now() - 345600000 },
      { category: 'art', title: '艺术活动参与', status: 'pending', lastUpdate: Date.now() - 432000000 },
      { category: 'social', title: '志愿服务', status: 'reviewing', lastUpdate: Date.now() - 518400000 },
      { category: 'social', title: '社会实践活动', status: 'cross_review', lastUpdate: Date.now() - 604800000 },
    ]

    // 实际的 API 调用可能如下：
    // const response = await axios.get('/api/report-status', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   reportItems.value = response.data.items
    // } else {
    //   throw new Error(response.data.msg)
    // }
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
  }
  return statusTypeMap[status] || 'info'
}

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

const getProgressStatus = (status: string) => {
  return status === 'confirmed' ? 'success' : ''
}

const getCategoryItems = (category: string) => {
  return reportItems.value.filter(item => item.category === category)
}

const confirmResult = async () => {
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('已确认评价结果')
    confirmDialogVisible.value = false
    await fetchReportStatus()

    // 实际的 API 调用可能如下：
    // const response = await axios.post('/api/confirm-result', null, {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   ElMessage.success('已确认评价结果')
    //   confirmDialogVisible.value = false
    //   await fetchReportStatus()
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (error) {
    console.error('确认失败:', error)
    ElMessage.error('确认失败，请稍后重试')
  }
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