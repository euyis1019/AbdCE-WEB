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
            <CategoryInfo :categoryCode="item.categoryCode" />
            <el-tag :type="getStatusType(item.status)">{{ item.status }}</el-tag>
          </div>
          <el-progress 
            :percentage="getProgressPercentage(item.status)" 
            :status="getProgressStatus(item.status)"
            :stroke-width="10"
            class="item-progress"
          ></el-progress>
          <p class="item-update"><strong>最后更新：</strong>{{ formatDate(item.submitTime) }}</p>
          <el-button type="primary" size="small" @click="goToEdit(item)">修改申报</el-button>
          <el-button type="danger" size="small" @click="confirmDelete(item)">删除申报</el-button>
          <el-divider v-if="index < reportItems.length - 1"></el-divider>
        </div>
      </div>
      <el-empty v-else description="暂无申报记录"></el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from '../../http-common'
import authService from '../../services/authService'
import CategoryInfo from '../../components/CategoryInfo.vue'

const router = useRouter()
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

    // 使用todolist/findcase接口获取用户所有已提交的条目
    const response = await axios.post('/todolist/findcase', {
      userID: user.ID
    })
    if (response.data.statusID === 0) {
      reportItems.value = response.data.data.map(item => ({
        ...item,
        status: getStatusLabel(item)
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

// 根据文件状态返回对应的标签
const getStatusLabel = (file: any) => {
  if (!file.isDone && !file.finalDone) return '待初审'
  if (file.isDone && !file.finalDone) return '初审通过'
  if (file.isDone && file.finalDone) return '终审通过'
  return '未知状态'
}

// 根据状态返回对应的标签类型
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

// 根据状态返回进度百分比
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

// 根据状态返回进度条状态
const getProgressStatus = (status: string) => {
  return status === '终审通过' ? 'success' : ''
}

// 跳转到编辑页面
const goToEdit = (item: any) => {
  router.push({
    name: 'ReportForm',
    params: { mode: 'edit', fileID: item.FileID }
  })
}

// 确认删除申报
const confirmDelete = (item: any) => {
  ElMessageBox.confirm(
    '确定要删除这条申报记录吗？此操作不可逆。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      deleteReport(item)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消删除',
      })
    })
}

// 删除申报
const deleteReport = async (item: any) => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/record/deleterecord', {
      FileID: item.FileID,
      userID: user.ID
    })

    if (response.data.statusID === 1) {
      ElMessage.success('申报记录已成功删除')
      // 从列表中移除已删除的项
      reportItems.value = reportItems.value.filter(report => report.FileID !== item.FileID)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('删除申报记录失败:', error)
    ElMessage.error('删除申报记录失败，请稍后重试')
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