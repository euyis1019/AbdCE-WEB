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
        <el-table :data="reportItems">
          <el-table-column label="类别" width="300">
            <template #default="scope">
              <CategoryInfo :categoryCode="scope.row.categorycode" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="150">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="300">
            <template #default="scope">
              <el-progress 
                :percentage="getProgressPercentage(scope.row.status)" 
                :status="getProgressStatus(scope.row.status)"
                :stroke-width="10"
              ></el-progress>
            </template>
          </el-table-column>
          <el-table-column label="最后更新" width="180">
            <template #default="scope">
              <p>{{ formatDate(scope.row.updatedAt) }}</p>
            </template>
          </el-table-column>
          <el-table-column label="描述">
            <template #default="scope">
              <p>{{ scope.row.description }}</p>
            </template>
          </el-table-column>
          <el-table-column label="文件" width="200">
            <template #default="scope">
              <p v-if="scope.row.file">{{ scope.row.file }}</p>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" size="small" @click="showEditDialog(scope.row)">修改申报</el-button>
              <el-button type="danger" size="small" @click="confirmDelete(scope.row)">删除申报</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无申报记录"></el-empty>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="修改申报" width="50%">
      <el-form :model="editingItem" label-width="100px">
        <el-form-item label="类别">
          <CategoryInfo :categoryCode="editingItem.categorycode" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingItem.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :on-progress="handleUploadProgress"
            :headers="uploadHeaders"
          >
            <el-button size="small" type="primary">更新文件</el-button>
          </el-upload>
          <el-progress v-if="uploadProgress > 0 && uploadProgress < 100" 
                       :percentage="uploadProgress"></el-progress>
          <p v-if="editingItem.file">当前文件：{{ editingItem.file }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateReport">确认修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '../../http-common'
import authService from '../../services/authService'
import CategoryInfo from '../../components/CategoryInfo.vue'

const loading = ref(false)
const reportItems = ref([])
const editDialogVisible = ref(false)
const editingItem = reactive({
  FileID: '',
  categorycode: '',
  description: '',
  file: ''
})
const uploadProgress = ref(0)
const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}admin/upload`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('jwt_token')
  return { Authorization: `Bearer ${token}` }
})

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

    const response = await axios.post('/record/userstatus', {
      userID: user.ID
    })
    if (response.data.statusID === 1) {
      const allFiles = [
        ...response.data.reviewTodoFiles,
        ...response.data.reviewDoneFiles,
        ...response.data.finalTodoFiles,
        ...response.data.finalDoneFiles
      ]
      
      reportItems.value = await Promise.all(allFiles.map(async (fileID) => {
        const fileStatusResponse = await axios.post('/record/filestatus', { FileID: fileID })
        if (fileStatusResponse.data.statusID === 1) {
          return {
            FileID: fileID,
            status: fileStatusResponse.data.status,
            isDone: fileStatusResponse.data.isDone,
            finalDone: fileStatusResponse.data.finalDone,
            updatedAt: new Date().toISOString(), // 使用当前时间作为更新时间
            description: '', // 这个字段可能需要从其他接口获取
            file: '', // 这个字段可能需要从其他接口获取
            categorycode: '' // 这个字段可能需要从其他接口获取
          }
        } else {
          throw new Error(fileStatusResponse.data.msg)
        }
      }))
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取申报状态失败:', error)
    ElMessage.error('获取申报状态失败，请稍后重试')
    reportItems.value = [] 
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case '待初审': return 'warning'
    case '初审通过': return 'primary'
    case '终审通过': return 'success'
    default: return 'info'
  }
}

const getProgressPercentage = (status: string) => {
  switch (status) {
    case '待初审': return 20
    case '初审通过': return 60
    case '终审通过': return 100
    default: return 0
  }
}

const getProgressStatus = (status: string) => {
  switch (status) {
    case '终审通过': return 'success'
    case '初审通过': return 'exception'
    default: return 'warning'
  }
}

const handleUploadSuccess = (res: any, file: any) => {
  if (res.statusID === 1) {
    editingItem.file = res.fileURL
    uploadProgress.value = 100
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(res.msg || '文件上传失败')
  }
}

const handleUploadError = (err: any) => {
  console.error('文件上传失败:', err)
  ElMessage.error('文件上传失败，请重试')
}

const beforeUpload = (file: any) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
  }
  return isLt10M
}

const handleUploadProgress = (event: any) => {
  uploadProgress.value = Math.round(event.percent)
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
      await fetchReportStatus() 
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('删除申报记录失败:', error)
    ElMessage.error('删除申报记录失败，请稍后重试')
  }
}

const showEditDialog = (item: any) => {
  editingItem.FileID = item.FileID
  editingItem.categorycode = item.categorycode
  editingItem.description = item.description
  editingItem.file = item.file
  editDialogVisible.value = true
}

const updateReport = async () => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/record/updatenewrecord', {
      FileID: editingItem.FileID,
      userID: user.ID,
      caseID: editingItem.categorycode,
      description: editingItem.description,
      file: editingItem.file,
    })

    if (response.data.statusID === 1) {
      ElMessage.success('申报更新成功')
      editDialogVisible.value = false
      await fetchReportStatus() 
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('更新申报失败:', error)
    ElMessage.error('更新申报失败，请稍后重试')
  }
}

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const refreshStatus = () => {
  fetchReportStatus()
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
.el-table {
  width: 100%;
  margin-bottom: 20px;
}
</style>