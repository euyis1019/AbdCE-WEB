<template>
  <div class="immersive-review">
    <header class="review-header">
      <el-button @click="exitReview" type="text" icon="ArrowLeft">退出审核</el-button>
      <h2>
        {{ isReReview ? '复审' : '初审' }} - {{ currentTaskTitle }}
      </h2>
      <span>审核员：{{ reviewerName }}</span>
    </header>

    <main class="review-content">
      <section class="review-left">
        <el-card class="review-card">
          <template #header>
            <h3>审核规则</h3>
          </template>
          <p v-if="currentTask.rules">{{ currentTask.rules }}</p>
          <p v-else>管理员还没有为这一条目添加评判标准，请参阅最新综测细则文件</p>
        </el-card>

        <el-card class="review-card material-preview">
          <template #header>
            <div class="preview-header">
              <h3>申请材料</h3>
              <el-button v-if="filePreviewUrl" @click="toggleFullScreen" icon="FullScreen">全屏预览</el-button>
            </div>
          </template>
          <div v-if="currentTask.FileID" class="preview-container" ref="previewContainer">
            <el-progress
              v-if="fileLoading"
              :percentage="loadingPercentage"
              :format="formatPercentage"
              :stroke-width="8"
              :show-text="true"
            ></el-progress>
            <div v-else-if="filePreviewUrl" class="file-preview">
              <img v-if="isImageFile" :src="filePreviewUrl" alt="File preview" class="preview-content" />
              <iframe v-else-if="isPdfFile" :src="filePreviewUrl" class="preview-content"></iframe>
              <div v-else class="unsupported-format">
                <p>不支持预览该文件格式</p>
                <el-button @click="openFileInNewTab">在新标签页中打开文件</el-button>
              </div>
            </div>
            <p v-else>请稍候，材料正在加载中...</p>
          </div>
        </el-card>
      </section>

      <section class="review-right">
        <div class="review-actions">
          <el-button 
            type="success" 
            size="large" 
            @click="submitReview('pass')" 
            icon="Check"
          >
            通过 (Ctrl+P)
          </el-button>
          <el-button 
            type="danger" 
            size="large" 
            @click="submitReview('reject')" 
            icon="Close"
          >
            拒绝 (Ctrl+R)
          </el-button>
        </div>

        <el-form :model="reviewForm" label-position="top">
          <el-form-item label="评分">
            <el-input-number v-model="reviewForm.score" :min="0" :max="100" :step="1" step-strictly controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input type="textarea" v-model="reviewForm.comment" :rows="4" placeholder="请输入审核意见（可选）"></el-input>
          </el-form-item>
        </el-form>

        <div class="bottom-actions">
          <el-button @click="getNextTask" type="primary" icon="ArrowRight">下一个 (Ctrl+N)</el-button>
        </div>
      </section>
    </main>

    <el-dialog v-model="confirmDialogVisible" title="确认提交" width="30%" center>
      <span>是否确认提交当前审核结果？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="guideVisible" title="欢迎进入材料审核模式" width="50%" center>
      <div class="guide-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <h4>键盘快捷键：</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="通过申请">Ctrl+P（⌘+P）</el-descriptions-item>
              <el-descriptions-item label="拒绝申请">Ctrl+R（⌘+R）</el-descriptions-item>
              <el-descriptions-item label="下一个任务">Ctrl+N（⌘+N）</el-descriptions-item>
              <el-descriptions-item label="退出审核模式">Esc</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <h4>操作说明：</h4>
            <ol>
              <li>查看左侧的审核规则和申请材料</li>
              <li>使用右侧的按钮或键盘快捷键进行审核</li>
              <li>可选择调整评分和添加审核意见</li>
              <li>点击"下一个"或按 Ctrl+N 继续下一项审核</li>
            </ol>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button type="primary" @click="closeGuide">开始审核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="fullScreenPreview" fullscreen :show-close="false">
      <div class="full-screen-preview">
        <div class="preview-toolbar">
          <el-button @click="toggleFullScreen" icon="Close">关闭全屏</el-button>
          <el-button @click="zoomIn" icon="ZoomIn">放大</el-button>
          <el-button @click="zoomOut" icon="ZoomOut">缩小</el-button>
        </div>
        <div class="preview-content-wrapper" ref="fullScreenContainer">
          <img v-if="isImageFile" :src="filePreviewUrl" alt="File preview" class="preview-content" :style="{ transform: `scale(${zoomLevel})` }" />
          <iframe v-else-if="isPdfFile" :src="filePreviewUrl" class="preview-content" :style="{ transform: `scale(${zoomLevel})` }"></iframe>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Close, FullScreen, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import axios from '../http-common'
import authService from '../services/authService'
import Cookies from 'js-cookie'

const router = useRouter()
const route = useRoute()

const confirmDialogVisible = ref(false)
const guideVisible = ref(true)
const fullScreenPreview = ref(false)
const zoomLevel = ref(1)

const currentTask = ref({
  FileID: '',
  caseID: '',
  userID: '',
  mainCLs: '',
  cls1: '',
  cls2: '',
  point: '',
  page: '',
  file: '',
  reviewercode: '',
  categorycode: '',
  isActive: true,
  isDone: false,
  priority: 0,
  applicationTime: '',
  rules: ''
})

const currentTaskTitle = ref('')
const reviewerName = ref('')

const reviewForm = ref({
  result: '',
  score: 0,
  comment: '',
})

const categoryTree = ref({})

const filePreviewUrl = ref('')
const fileContentType = ref('')
const fileLoading = ref(false)
const loadingPercentage = ref(0)
const previewContainer = ref(null)
const fullScreenContainer = ref(null)

const isReReview = computed(() => route.query.mode === 'rereview')

const isAdmin = computed(() => {
  const user = authService.getCurrentUser()
  return user && user.Permission === '3'
})

const isImageFile = computed(() => {
  return fileContentType.value === 'image/png' || fileContentType.value === 'image/jpeg' || fileContentType.value === 'image/gif'
})

const isPdfFile = computed(() => {
  return fileContentType.value === 'application/pdf'
})

const exitReview = () => {
  if (route.query.returnTo === 'review-management') {
    router.push('/review-management')
  } else {
    router.push('/admin/todo')
  }
}

const submitReview = (result: 'pass' | 'reject') => {
  reviewForm.value.result = result
  confirmDialogVisible.value = true
}

const confirmSubmit = async () => {
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const endpoint = isReReview.value ? '/admin/finalDone' : '/admin/isdone';
    const payload: { [key: string]: any } = {
      userID: user.ID,
      FileID: currentTask.value.FileID,
      reviewerID: user.ID,
      comment: reviewForm.value.comment,
      score: reviewForm.value.score
    };

    if (isReReview.value) {
      payload.finalDone = reviewForm.value.result === 'pass';
    } else {
      payload.isDone = reviewForm.value.result === 'pass';
    }

    const response = await axios.post(endpoint, payload);

    if (response.data.statusID === 1) {
      ElMessage.success('审核结果已提交');
      confirmDialogVisible.value = false;
      await getNextTask();
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    ElMessage.error('提交审核结果失败，请重试');
  }
}

const getNextTask = async () => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.get('/admin/getCE', {
      params: { userID: user.ID }
    })

    if (response.data.statusID === 0) {
      const taskList = isReReview.value ? response.data.data.finalTodoList.files : response.data.data.reviewTodoList.files;
      if (taskList.length > 0) {
        currentTask.value = taskList[0]
        reviewForm.value = {
          result: '',
          score: 0,
          comment: '',
        }
        await fetchTaskDetails()
      } else {
        ElMessage.info('所有任务已审核完毕')
        exitReview()
      }
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取下一个任务失败，请重试')
  }
}

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
    ElMessage.error('获取类别树失败，请稍后重试')
  }
}

const findCategoryInfo = (tree, targetCode, currentPath = []) => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value && value.caseID.toString() === targetCode.toString()) {
        return {
          path: [...currentPath, key],
          topPoint: value.topPoint,
          judgement: value.judgement
        }
      }
      const result = findCategoryInfo(value, targetCode, [...currentPath, key])
      if (result) return result
    }
  }
  return null
}

const fetchTaskDetails = async () => {
  try {
    // Fetch file status to get caseID
    const fileStatusResponse = await axios.post('/record/filestatus', { FileID: currentTask.value.FileID })
    if (fileStatusResponse.data.statusID === 1) {
      currentTask.value.caseID = fileStatusResponse.data.caseID

      // Find category info in the category tree
      const categoryInfo = findCategoryInfo(categoryTree.value, currentTask.value.caseID)
      if (categoryInfo) {
        currentTaskTitle.value = categoryInfo.path.join(' > ')
        currentTask.value.rules = categoryInfo.judgement || ''
      } else {
        currentTaskTitle.value = '未知类别'
        currentTask.value.rules = ''
      }

      await fetchFilePreview(currentTask.value.FileID)
    }
  } catch (error) {
    console.error('Error fetching task details:', error)
    ElMessage.error('获取任务详情失败，请重试')
  }
}

const fetchFilePreview = async (fileID: string) => {
  fileLoading.value = true
  loadingPercentage.value = 0
  try {
    const token = Cookies.get('jwt_token')
    const response = await axios.get(`${process.env.VUE_APP_API_URL}record/download`, {
      params: { fileID },
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1))
        loadingPercentage.value = percentCompleted
      }
    })

    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    fileContentType.value = response.headers['content-type']
    filePreviewUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('文件预览失败:', error)
    ElMessage.error('文件预览加载失败，请重试')
  } finally {
    fileLoading.value = false
  }
}

const formatPercentage = (percentage: number) => {
  return percentage === 100 ? '加载完成' : `${percentage}%`
}

const toggleFullScreen = () => {
  fullScreenPreview.value = !fullScreenPreview.value
  zoomLevel.value = 1 // 重置缩放级别
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5)
}

const openFileInNewTab = () => {
  window.open(filePreviewUrl.value, '_blank')
}

const adjustPreviewSize = () => {
  if (previewContainer.value) {
    const container = previewContainer.value
    const content = container.querySelector('.preview-content')
    if (content) {
      const scale = Math.min(
        container.clientWidth / content.naturalWidth,
        container.clientHeight / content.naturalHeight
      )
      content.style.transform = `scale(${scale})`
    }
  }
}

const closeGuide = () => {
  guideVisible.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否在输入框中
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return; // 如果在输入框中，不处理快捷键
  }

  if (event.ctrlKey || event.metaKey) { // metaKey 用于 Mac 的 Command 键
    switch (event.key.toLowerCase()) {
      case 'p':
        event.preventDefault();
        submitReview('pass');
        break;
      case 'r':
        event.preventDefault();
        submitReview('reject');
        break;
      case 'n':
        event.preventDefault();
        getNextTask();
        break;
    }
  } else if (event.key === 'Escape') {
    exitReview();
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', adjustPreviewSize)
  const user = authService.getCurrentUser()
  reviewerName.value = user?.Name || '未知审核员'
  await fetchCategoryTree()
  await getNextTask()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', adjustPreviewSize)
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
})

watch(filePreviewUrl, () => {
  nextTick(adjustPreviewSize)
})

</script>

<style scoped>
.immersive-review {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-header {
  background-color: #fff;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.review-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.review-left,
.review-right {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.review-left {
  background-color: #fff;
}

.review-card {
  margin-bottom: 20px;
}

.material-preview {
  height: calc(100% - 200px);
}

.material-preview .el-card__body {
  height: calc(100% - 60px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.el-progress {
  width: 80%;
}

.review-actions {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.review-actions .el-button {
  padding: 15px 30px;
  font-size: 18px;
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.guide-content {
  margin-bottom: 20px;
}

.guide-content h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.guide-content ol {
  padding-left: 20px;
}

.full-screen-preview {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  padding: 10px;
  background-color: #f0f2f5;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.preview-content-wrapper {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.unsupported-format {
  text-align: center;
}

@media (max-width: 768px) {
  .review-content {
    flex-direction: column;
  }

  .review-left,
  .review-right {
    width: 100%;
  }

  .review-actions {
    flex-direction: column;
  }

  .review-actions .el-button {
    margin-bottom: 10px;
  }
}
</style>