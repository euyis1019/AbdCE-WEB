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
              <el-button type="info" size="small" @click="previewFile(scope.row.fileID)" :disabled="!scope.row.fileID">预览附件</el-button>
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
          <p v-if="editingItem.fileID">当前文件：{{ editingItem.fileID }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateReport">确认修改</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" title="文件预览" width="80%" fullscreen :show-close="false" @close="closePreview">
      <div class="full-screen-preview">
        <div class="preview-toolbar">
          <el-button @click="toggleFullScreen" :icon="isFullScreen ? 'Close' : 'FullScreen'">
            {{ isFullScreen ? '退出全屏' : '全屏预览' }}
          </el-button>
          <el-button @click="zoomIn" icon="ZoomIn">放大</el-button>
          <el-button @click="zoomOut" icon="ZoomOut">缩小</el-button>
          <el-button @click="closePreview" icon="Close">关闭预览</el-button>
        </div>
        <div class="preview-content-wrapper" ref="fullScreenContainer">
          <img v-if="isImageFile" :src="previewUrl" alt="File preview" class="preview-content" :style="previewStyle" />
          <iframe v-else-if="isPdfFile" :src="previewUrl" class="preview-content" :style="previewStyle"></iframe>
          <div v-else class="unsupported-format">
            <p>不支持预览该文件格式</p>
            <el-button @click="openFileInNewTab">在新标签页中打开文件</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, FullScreen, ZoomIn, ZoomOut, Close } from '@element-plus/icons-vue'
import axios from '../../http-common'
import authService from '../../services/authService'
import Cookies from 'js-cookie'
import { debounce } from 'lodash' // 确保已经安装了 lodash

interface ReportItem {
  fileID: string;
  caseID: string;
  status: string;
  isDone: boolean;
  finalDone: boolean;
  score: number;
  categoryTitle: string;
  categoryPath: string[];
}

const loading = ref(false)
const tableLoading = ref(false)
const error = ref('')
const reportItems = ref<ReportItem[]>([])
const editDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const previewUrl = ref('')
const previewFileType = ref('')
const zoomLevel = ref(1)
const isFullScreen = ref(false)
const fullScreenContainer = ref(null)

const editingItem = reactive({
  fileID: '',
  caseID: '',
  status: '',
  isDone: false,
  finalDone: false,
  score: 0,
  categoryPath: [] as string[],
  categoryCode: '',
  categoryTitle: '',
})

const uploadProgress = ref(0)
const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}admin/upload`)
const uploadHeaders = computed(() => {
  const token = Cookies.get('jwt_token')
  return { Authorization: `Bearer ${token}` }
})

// 下载进度
const downloadProgress = ref(0) 

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

const isImageFile = computed(() => previewFileType.value.startsWith('image/'))
const isPdfFile = computed(() => previewFileType.value === 'application/pdf')
const previewStyle = computed(() => ({
  transform: `scale(${zoomLevel.value})`,
  transition: 'transform 0.3s ease'
}))

const resizeObserver = ref(null)

// 防抖的 resize 处理函数
const handleResize = debounce(() => {
  // 在这里处理 resize 逻辑
  // 例如，重新计算表格的高度或宽度
}, 200)

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  await fetchCategoryTree()
  await fetchReportStatus()

  // 设置 ResizeObserver
  resizeObserver.value = new ResizeObserver(handleResize)
  resizeObserver.value.observe(document.body)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  closePreview()

  // 断开 ResizeObserver 的连接
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
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
            }
          } else {
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
    console.error('Error fetching report status:', error)
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
    editingItem.fileID = res.fileID
    uploadProgress.value = 100
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(res.msg || '文件上传失败')
  }
}

const handleUploadError = (err: any) => {
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
      file: editingItem.fileID
    })

    if (response.data.statusID === 1) {
      ElMessage.success('申报更新成功')
      editDialogVisible.value = false
      await fetchReportStatus()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('Error updating report:', error)
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
    console.error('Error deleting report:', error)
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

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}


const previewFile = async (fileID: string) => {
  if (fileID) {
    try {
      const token = Cookies.get('jwt_token')
      const config = {
        params: { fileID },
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            downloadProgress.value = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
          }
        }
      }
      const response = await axios.get(`record/download`, config)

      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      previewUrl.value = URL.createObjectURL(blob)
      previewFileType.value = response.headers['content-type']
      previewDialogVisible.value = true
      zoomLevel.value = 1 // 重置缩放级别
      downloadProgress.value = 0 // 重置下载进度
      ElMessage.success('文件预览成功')
    } catch (error) {
      console.error('文件预览失败:', error)
      ElMessage.error('文件预览失败，请稍后重试')
    }
  } else {
    ElMessage.warning('没有可预览的文件')
  }
}

const toggleFullScreen = async () => {
  if (!document.fullscreenElement) {
    await fullScreenContainer.value.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
  // 在全屏切换后，给一些时间让浏览器调整，然后触发一次 resize
  await nextTick()
  setTimeout(handleResize, 100)
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5)
}

const openFileInNewTab = () => {
  window.open(previewUrl.value, '_blank')
}

const closePreview = () => {
  previewDialogVisible.value = false
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  zoomLevel.value = 1 // 重置缩放级别
}

const handleFullscreenChange = () => {
  isFullScreen.value = !!document.fullscreenElement
}

// 计算属性：类别选项
const categoryOptions = computed(() => {
  if (!categoryTree.value) return []
  return convertTreeToOptions(categoryTree.value)
})

// 将类别树转换为级联选择器的选项格式
const convertTreeToOptions = (tree) => {
  return Object.entries(tree).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value) {
        return {
          value: value.caseID.toString(),
          label: key,
          isLeaf: true
        }
      } else {
        return {
          value: key,
          label: key,
          children: convertTreeToOptions(value)
        }
      }
    }
  }).filter(Boolean)
}

// 全局错误处理
const handleError = (error, message) => {
  console.error('Error:', error)
  ElMessage.error(message)
}

window.addEventListener('error', (event) => {
  handleError(event.error, '发生了意外错误，请刷新页面重试')
})

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason, '发生了未处理的异步错误，请刷新页面重试')
})
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



.preview-toolbar {
  padding: 10px;
  background-color: #f0f2f5;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 使用 CSS 来处理一些布局问题，减少对 ResizeObserver 的依赖 */
.full-screen-preview {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.preview-content-wrapper {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative; 
}

.preview-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  position: absolute;
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%); 
}


.unsupported-format {
  text-align: center;
}

@media (max-width: 768px) {
  .report-state {
    padding: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .el-button {
    margin-top: 10px;
    width: 100%;
  }

  .el-table {
    font-size: 12px;
  }

  .pagination-container {
    justify-content: center;
  }
}
</style>