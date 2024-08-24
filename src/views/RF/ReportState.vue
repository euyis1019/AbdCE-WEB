<template>
  <div class="report-state">
    <h1>申报进度查询</h1>
    <el-card v-loading="loading" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>申报进度</span>
          <el-button type="primary" @click="refreshStatus" :loading="loading" icon="Refresh">
            刷新
          </el-button>
        </div>
      </template>
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        @close="error = ''"
      />
      <div v-if="reportItems.length > 0">
        <el-table 
          :data="paginatedReportItems" 
          style="width: 100%"
          v-loading="tableLoading"
          @sort-change="handleSortChange"
        >
          <el-table-column prop="categoryTitle" label="类别" min-width="180" sortable="custom">
            <template #default="scope">
              <el-tooltip :content="scope.row.fileID" placement="top" effect="light">
                {{ scope.row.categoryTitle }}
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" sortable="custom">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="分数" width="80" sortable="custom" />
          <el-table-column label="进度" min-width="300">
            <template #default="scope">
              <div class="progress-wrapper">
                <el-progress
                  :percentage="getProgressPercentage(scope.row.status)"
                  :status="getProgressStatus(scope.row.status)"
                  :stroke-width="10"
                  :format="(percentage) => `${percentage}%`"
                >
                  <template #default="{ percentage, status }">
                    <span class="progress-label">{{ getProgressLabel(scope.row.status) }}</span>
                  </template>
                </el-progress>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="showEditDialog(scope.row)">修改申报</el-button>
              <el-button type="danger" size="small" @click="confirmDelete(scope.row)">删除申报</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="reportItems.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
      <el-empty v-else-if="!loading" description="暂无申报记录"></el-empty>
    </el-card>

    <!-- 编辑对话框 TODO: 分类选择框完善 -->
    <el-dialog v-model="editDialogVisible" title="修改申报" width="50%">
      <el-form :model="editingItem" label-width="100px">
        <el-form-item label="类别">
          <el-cascader
            v-model="editingItem.categoryPath"
            :options="categoryOptions"
            @change="handleCategoryChange"
            placeholder="请选择类别"
          />
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

interface ReportItem {
  fileID: string;
  caseID: string;
  status: string;
  isDone: boolean;
  finalDone: boolean;
  score: number;
  categoryTitle: string;
  file: string;
}

const loading = ref(false)
const tableLoading = ref(false)
const error = ref('')
const reportItems = ref<ReportItem[]>([])
const editDialogVisible = ref(false)
const editingItem = reactive({
  fileID: '',
  caseID: '',
  status: '',
  isDone: false,
  finalDone: false,
  score: 0,
  categoryPath: [],
  categoryCode: '',
  categoryTitle: '',
  file: ''
})
const uploadProgress = ref(0)
const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}admin/upload`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('jwt_token')
  return { Authorization: `Bearer ${token}` }
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const paginatedReportItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return reportItems.value.slice(start, end)
})

// 排序相关
const sortBy = ref('')
const sortOrder = ref('ascending')

const categoryTree = ref(null)

onMounted(async () => {
  await fetchCategoryTree()
  await fetchReportStatus()
})

const fetchCategoryTree = async () => {
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryTree.value = response.data.data
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取类别树失败:', error)
    ElMessage.error('获取类别数据失败，请稍后重试')
  }
}
const fetchReportStatus = async () => {
  loading.value = true
  error.value = ''
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
        try {
          const fileStatusResponse = await axios.post('/record/filestatus', { FileID: fileID })
          if (fileStatusResponse.data.statusID === 1) {
            const item = fileStatusResponse.data
            const categoryInfo = findCategoryInfo(categoryTree.value, item.caseID.toString())
            return {
              fileID: item.fileID,
              caseID: String(item.caseID),
              status: item.status,
              isDone: item.isDone,
              finalDone: item.finalDone,
              score: categoryInfo ? parseFloat(categoryInfo.topPoint) : 0,
              categoryPath: categoryInfo ? categoryInfo.path : [],
              categoryTitle: categoryInfo ? categoryInfo.path.join(' > ') : 'Unknown Category',
              file: item.file || ''
            }
          } else {
            console.error('File status error:', fileStatusResponse.data.msg)
            return null
          }
        } catch (error) {
          console.error('Error fetching file status:', error)
          return null
        }
      }))

      reportItems.value = reportItems.value.filter(item => item !== null)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取申报状态失败:', error)
    error.value = '获取申报状态失败，请稍后重试'
    reportItems.value = []
  } finally {
    loading.value = false
  }
}

const findCategoryInfo = (tree, targetCode, currentPath = []) => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value && value.caseID.toString() === targetCode) {
        return {
          path: [...currentPath, key],
          topPoint: value.topPoint
        }
      }
      const result = findCategoryInfo(value, targetCode, [...currentPath, key])
      if (result) return result
    }
  }
  return null
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

const getProgressLabel = (status: string) => {
  switch (status) {
    case '待初审': return '等待初审'
    case '初审通过': return '初审已通过，等待终审'
    case '终审通过': return '审核完成'
    default: return '未知状态'
  }
}

const showEditDialog = (item: ReportItem) => {
  Object.assign(editingItem, item)
  editingItem.categoryPath = item.categoryPath
  editDialogVisible.value = true
}

const handleCategoryChange = (value) => {
  const categoryInfo = findCategoryInfo(categoryTree.value, value[value.length - 1])
  editingItem.categoryTitle = categoryInfo ? categoryInfo.path.join(' > ') : 'Unknown Category'
  editingItem.categoryCode = value[value.length - 1]
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

const updateReport = async () => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/record/updatenewrecord', {
      fileID: editingItem.fileID,
      userID: user.ID,
      caseID: editingItem.categoryCode,
      file: editingItem.file
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

const confirmDelete = (item: ReportItem) => {
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

const deleteReport = async (item: ReportItem) => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/record/deleterecord', {
      fileID: item.fileID,
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

const refreshStatus = () => {
  fetchReportStatus()
}

const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  sortReportItems()
}

const sortReportItems = () => {
  if (sortBy.value) {
    reportItems.value.sort((a, b) => {
      let comparison = 0
      if (a[sortBy.value] > b[sortBy.value]) {
        comparison = 1
      } else if (a[sortBy.value] < b[sortBy.value]) {
        comparison = -1
      }
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
  }
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
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
  margin-bottom: 20px;
}
.el-table .cell {
  white-space: nowrap;
}
.progress-wrapper {
  display: flex;
  align-items: center;
}
.progress-label {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
