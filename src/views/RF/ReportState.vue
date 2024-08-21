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
        <div v-for="(item, index) in reportItems" :key="item.FileID" class="report-item">
          <div class="item-header">
            <CategoryInfo :categoryCode="item.categorycode" />
            <el-tag :type="getStatusType(item.status)">{{ item.status }}</el-tag>
          </div>
          <el-progress 
            :percentage="getProgressPercentage(item.status)" 
            :status="getProgressStatus(item.status)"
            :stroke-width="10"
            class="item-progress"
          ></el-progress>
          <p class="item-update"><strong>最后更新：</strong>{{ formatDate(item.updatedAt) }}</p>
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

    // 获取用户提交的所有案件信息
    const recordResponse = await axios.post('/record/findrecord', {
      userID: user.ID
    })
    if (recordResponse.data.statusID === 0) {
      const records = recordResponse.data.data

      // 获取每个案件的审核状态
      const statusPromises = records.map(record => 
        axios.post('/admin/filestatus', { FileID: record.FileID })
      )

      const statusResponses = await Promise.all(statusPromises)

      reportItems.value = records.map((record, index) => {
        const statusResponse = statusResponses[index]
        const status = statusResponse.data.statusID === 1 ? statusResponse.data : { status: '未知' }
        return {
          ...record,
          status: getStatusLabel(status.status),
          isDone: status.isDone,
          finalDone: status.finalDone
        }
      })
    } else {
      throw new Error(recordResponse.data.msg)
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

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'reviewing': return '审核中'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '未知状态'
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case '待审核': return 'warning'
    case '审核中': return 'primary'
    case '已通过': return 'success'
    case '已拒绝': return 'danger'
    default: return 'info'
  }
}

const getProgressPercentage = (status: string) => {
  switch (status) {
    case '待审核': return 0
    case '审核中': return 50
    case '已通过': return 100
    case '已拒绝': return 100
    default: return 0
  }
}

const getProgressStatus = (status: string) => {
  return status === '已通过' ? 'success' : (status === '已拒绝' ? 'exception' : '')
}

const goToEdit = (item: any) => {
  router.push({
    name: 'ReportForm',
    params: { mode: 'edit', fileID: item.FileID }
  })
}

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

.report-item {
  margin-bottom: 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
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
}
</style>