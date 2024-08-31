<template>
  <div class="report-form">
    <h1>{{ isEditMode ? '修改申报' : '综合评价信息申报' }}</h1>

    <el-steps :active="currentStepIndex" finish-status="success">
      <el-step v-for="(category, index) in topLevelCategories" :key="index" :title="category" />
      <el-step title="综测得分明细">
        <template #icon>
          <el-icon><Document /></el-icon>
        </template>
      </el-step>
    </el-steps>

    <el-card v-loading="loading" element-loading-text="加载中...">
      <el-alert v-if="error" :title="error" type="error" show-icon @close="error = ''" />
      <div v-if="debug"></div>
      <template v-if="!loading && topLevelCategories.length > 0">
        <el-form v-if="currentStepIndex < topLevelCategories.length" :model="currentStep" ref="formRef" label-width="120px">
          <h2>{{ currentCategory }}</h2>
          <div v-for="(item, index) in currentStep.items" :key="index">
            <el-divider v-if="index > 0" />
            <el-form-item label="类别">
              <el-cascader
                v-model="item.categoryPath"
                :options="categoryOptions"
                @change="value => handleCategoryChange(value, index)"
                placeholder="请选择类别"
              />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="item.description" type="textarea" :rows="3"></el-input>
            </el-form-item>
            <el-form-item label="上传文件">
              <el-upload
                class="upload-demo"
                :http-request="(params) => customUpload({ ...params, index })"
                :on-success="(res, file) => handleUploadSuccess(res, file, index)"
                :on-error="handleUploadError"
                :before-upload="file => beforeUpload(file, index)"
                :disabled="!item.fileID"
              >
                <el-button size="small" type="primary" :disabled="!item.fileID">点击上传</el-button>
                <template #tip>
                  <div class="el-upload__tip">只能上传jpg/png/pdf文件，且不超过10MB</div>
                </template>
              </el-upload>
              <el-progress v-if="item.uploadProgress > 0 && item.uploadProgress < 100" :percentage="item.uploadProgress"></el-progress>
              <div v-if="item.file">
                <p>已上传文件: {{ item.file.name }}</p>
                <el-button size="small" type="primary" @click="previewFile(item.fileID)">预览文件</el-button>
              </div>
            </el-form-item>
            <el-button type="danger" @click="removeItem(index)" v-if="currentStep.items.length > 1">删除此项</el-button>
          </div>
          <el-button type="primary" @click="addItem">添加新项</el-button>
          <div class="form-actions">
            <el-button @click="prevStep" v-if="currentStepIndex > 0">上一步</el-button>
            <el-button type="primary" @click="nextStep">{{ currentStepIndex === topLevelCategories.length - 1 ? '跳过' : '下一步' }}</el-button>
            <el-button @click="saveDraft">保存草稿</el-button>
          </div>
        </el-form>
        <div v-else-if="currentStepIndex === topLevelCategories.length">
          <h2>综测得分明细</h2>
          <el-table :data="allItemsWithScores" style="width: 100%">
            <el-table-column prop="categoryPath" label="类别">
              <template #default="scope">
                <CategoryInfo :categoryCode="scope.row.categoryCode" :ref="el => { if (el) categoryInfoRefs[scope.row.categoryCode] = el }" />
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="file" label="文件">
              <template #default="scope">
                {{ scope.row.file ? scope.row.file.name : '未上传' }}
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分数" width="80">
              <template #default="scope">
                <span :class="{ 'negative-score': scope.row.score < 0 }">
                  {{ scope.row.score }}
                </span>
              </template>
            </el-table-column>
          </el-table>

          <el-card class="score-summary">
            <template #header>
              <div class="card-header">
                <span>得分汇总</span>
              </div>
            </template>
            <div v-for="(sum, category) in categoryScoreSums" :key="category" class="category-sum">
              <strong>{{ category }}:</strong> 
              <span :class="{ 'negative-score': sum < 0 }">{{ sum }}</span>
            </div>
            <div class="total-score">
              <strong>总分:</strong> 
              <span :class="{ 'negative-score': totalScore < 0 }">{{ totalScore }}</span>
            </div>
          </el-card>

          <div class="form-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="submitForm">提交申报</el-button>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无数据"></el-empty>
    </el-card>

    <el-dialog v-model="previewDialogVisible" title="文件预览" :fullscreen="isFullScreen" :show-close="false" @close="closePreview">
      <div class="preview-container" :class="{ 'fullscreen': isFullScreen }">
        <div class="preview-toolbar">
          <el-button @click="toggleFullScreen" :icon="isFullScreen ? 'Close' : 'FullScreen'">
            {{ isFullScreen ? '退出全屏' : '全屏预览' }}
          </el-button>
          <el-button @click="zoomIn" icon="ZoomIn">放大</el-button>
          <el-button @click="zoomOut" icon="ZoomOut">缩小</el-button>
          <el-button @click="closePreview" icon="Close">关闭预览</el-button>
        </div>
        <div class="preview-content-wrapper" ref="previewContentWrapper">
          <div v-if="isLoading" class="loading-overlay">
            <el-progress 
              type="circle" 
              :percentage="downloadProgress" 
              :format="formatProgress"
            ></el-progress>
            <p>预计剩余时间: {{ remainingTime }}</p>
            <div class="loading-animation"></div>
          </div>
          <img v-if="isImageFile && !isLoading" :src="previewUrl" alt="File preview" class="preview-content" :style="previewStyle" />
          <iframe v-else-if="isPdfFile && !isLoading" :src="previewUrl" class="preview-content" :style="previewStyle"></iframe>
          <div v-else-if="!isLoading" class="unsupported-format">
            <p>不支持预览该文件格式</p>
            <el-button @click="openFileInNewTab">在新标签页中打开文件</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, FullScreen, ZoomIn, ZoomOut, Close } from '@element-plus/icons-vue'
import axios from '@/http-common'
import authService from '@/services/authService'
import CategoryInfo from '@/components/CategoryInfo.vue'
import Cookies from 'js-cookie'

const router = useRouter()
const formRef = ref(null)
const isEditMode = ref(false)
const currentUser = ref(null)
const loading = ref(false)
const error = ref('')
const debug = ref(true)

const topLevelCategories = ref([])
const categoryTree = ref(null)
const currentStepIndex = ref(0)
const formData = ref({})
const categoryInfoRefs = ref({})

const previewDialogVisible = ref(false)
const previewUrl = ref('')
const previewFileType = ref('')
const zoomLevel = ref(1)
const isFullScreen = ref(false)
const fullScreenContainer = ref(null)

const uploadingFiles = ref(new Set())

// 新增的预览相关状态
const isLoading = ref(false)
const downloadProgress = ref(0)
const remainingTime = ref('计算中...')
const downloadStartTime = ref(0)
const totalFileSize = ref(0)

const currentCategory = computed(() => topLevelCategories.value[currentStepIndex.value] || '')
const currentStep = computed(() => (currentCategory.value && formData.value[currentCategory.value]) ? formData.value[currentCategory.value] : { items: [] })
const categoryOptions = computed(() => getCategoryOptions(currentCategory.value))
const allItems = computed(() => Object.values(formData.value).flatMap(step => step.items.filter(item => item.categoryPath.length > 0 || item.description || item.file)))
const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}record/upload`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${Cookies.get('jwt_token')}`
}))

const isImageFile = computed(() => previewFileType.value.startsWith('image/'))
const isPdfFile = computed(() => previewFileType.value === 'application/pdf')
const previewStyle = computed(() => ({
  transform: `scale(${zoomLevel.value})`,
  transition: 'transform 0.3s ease',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain'
}))

// 新增的评分相关计算属性
const allItemsWithScores = computed(() => {
  return allItems.value.map(item => ({
    ...item,
    score: getCategoryScore(item.categoryCode)
  }))
})

const categoryScoreSums = computed(() => {
  const sums = {}
  allItemsWithScores.value.forEach(item => {
    const topCategory = item.categoryPath[0]
    if (!sums[topCategory]) {
      sums[topCategory] = 0
    }
    sums[topCategory] += item.score
  })
  return sums
})

const totalScore = computed(() => {
  return Object.values(categoryScoreSums.value).reduce((sum, score) => sum + score, 0)
})

// 获取类别树数据
const fetchCategoryTree = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryTree.value = response.data.data
      topLevelCategories.value = Object.keys(categoryTree.value).filter(key => key !== 'Main Category')
      initFormData()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (err) {
    error.value = '获取类别数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 初始化表单数据
const initFormData = () => {
  topLevelCategories.value.forEach(category => {
    if (!formData.value[category]) {
      formData.value[category] = { items: [createEmptyItem()] }
    }
  })
}

// 创建空的表单项
const createEmptyItem = () => ({
  categoryPath: [],
  categoryCode: '',
  description: '',
  file: null,
  fileID: '',
  uploadProgress: 0,
  score: 0
})

// 获取类别选项
const getCategoryOptions = (topCategory) => {
  if (!categoryTree.value || !topCategory) return []
  const categoryTreeData = categoryTree.value[topCategory]
  return convertTreeToOptions(categoryTreeData)
}

// 将类别树转换为选项格式
const convertTreeToOptions = (tree) => {
  return Object.entries(tree).map(([key, value]) => {
    if (typeof value === 'object' && value !== null && !('caseID' in value)) {
      return {
        value: key,
        label: key,
        children: convertTreeToOptions(value)
      }
    } else if ('caseID' in value) {
      return {
        value: value.caseID.toString(),
        label: key,
        isLeaf: true
      }
    }
  }).filter(Boolean)
}

// 处理类别变化
const handleCategoryChange = async (value, index) => {
  const item = currentStep.value.items[index]
  item.categoryCode = value[value.length - 1]
  await createCaseFile(item)
}

// 创建案例文件
const createCaseFile = async (item) => {
  if (!item.categoryCode) return

  loading.value = true
  error.value = ''
  try {
    const response = await axios.post('/record/newrecord', {
      userID: currentUser.value.StudentId,
      caseID: item.categoryCode,
      mainCls: currentCategory.value,
      cls1: item.categoryPath[0],
      cls2: item.categoryPath[1],
      cls3: item.categoryPath[2],
      point: '',
      description: item.description,
      categorycode: item.categoryCode
    })

    if (response.data.statusID === 1) {
      item.fileID = response.data.fileID
      ElMessage.success('案例文件创建成功，可以上传文件了')
    } else {
      throw new Error(response.data.msg)
    }
  } catch (err) {
    error.value = '创建案例文件失败，请重试'
  } finally {
    loading.value = false
  }
}

// 上传前的检查
const beforeUpload = (file, index) => {
  const item = currentStep.value.items[index]
  if (!item.fileID) {
    ElMessage.error('请先选择完整的类别')
    return false
  }
  if (uploadingFiles.value.has(file.name)) {
    ElMessage.warning('该文件正在上传中，请勿重复上传')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
  }
  if (!isValidType) {
    ElMessage.error('只能上传 JPG/PNG/PDF 格式的文件!')
  }
  return isLt10M && isValidType
}

// 自定义上传方法
const customUpload = async ({ file, onProgress, onSuccess, onError, index }) => {
  if (uploadingFiles.value.has(file.name)) {
    onError(new Error('文件正在上传中'))
    return
  }

  uploadingFiles.value.add(file.name)

  const item = currentStep.value.items[index]
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileID', item.fileID)
  formData.append('userID', currentUser.value.ID)
  formData.append('caseID', item.categoryCode)

  try {
    const response = await axios.post('/record/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ percent: percentCompleted })
        item.uploadProgress = percentCompleted
      }
    })    
    if (response.data && response.data.statusID === 1) {
      onSuccess(response.data)
    } else {
      throw new Error(response.data?.msg || '上传失败')
    }
  } catch (error) {
    console.error('Upload error:', error)
    onError(error)
  } finally {
    uploadingFiles.value.delete(file.name)
  }
}

// 处理上传成功
const handleUploadSuccess = (res, file, index) => {
  console.log('Upload response:', res)

  if (res && res.statusID === 1) {
    currentStep.value.items[index].file = { name: file.name, fileID: res.fileID }
    currentStep.value.items[index].uploadProgress = 100
    ElMessage.success('上传成功')
  } else {
    console.error('Upload failed:', res)
    ElMessage.error(res && res.msg || '上传失败，请重试')
    currentStep.value.items[index].uploadProgress = 0
  }
}

// 处理上传错误
const handleUploadError = (error) => {
  console.error('Upload error:', error)
  ElMessage.error('文件上传失败，请重试')
}

// 预览文件
const previewFile = async (fileID) => {
  if (fileID) {
    try {
      isLoading.value = true
      downloadProgress.value = 0
      remainingTime.value = '计算中...'
      downloadStartTime.value = Date.now()

      const token = Cookies.get('jwt_token')
      const config = {
        params: { fileID, userID: currentUser.value.StudentId },
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          downloadProgress.value = percentCompleted
          totalFileSize.value = progressEvent.total

          // 计算剩余时间
          const elapsedTime = (Date.now() - downloadStartTime.value) / 1000
          const downloadSpeed = progressEvent.loaded / elapsedTime
          const remainingBytes = progressEvent.total - progressEvent.loaded
          const remainingSeconds = remainingBytes / downloadSpeed
          remainingTime.value = formatTime(remainingSeconds)
        }
      }
      const response = await axios.get(`record/download`, config)

      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      previewUrl.value = URL.createObjectURL(blob)
      previewFileType.value = response.headers['content-type']
      previewDialogVisible.value = true
      zoomLevel.value = 1 // 重置缩放级别
      ElMessage.success('文件预览成功')
    } catch (error) {
      console.error('文件预览失败:', error)
      ElMessage.error('文件预览失败，请稍后重试')
    } finally {
      isLoading.value = false
    }
  } else {
    ElMessage.warning('没有可预览的文件')
  }
}

// 格式化时间
const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}分钟`
  } else {
    return `${Math.round(seconds / 3600)}小时以上`
  }
}

// 格式化进度
const formatProgress = (percentage) => {
  if (percentage === 100) return '完成'
  const downloadedSize = (totalFileSize.value * percentage) / 100
  return `${(downloadedSize / (1024 * 1024)).toFixed(2)}MB / ${(totalFileSize.value / (1024 * 1024)).toFixed(2)}MB`
}

// 切换全屏
const toggleFullScreen = async () => {
  if (!document.fullscreenElement) {
    await fullScreenContainer.value.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
  isFullScreen.value = !isFullScreen.value
  // 在全屏切换后，给一些时间让浏览器调整，然后触发一次 resize
  await nextTick()
  setTimeout(handleResize, 100)
}

// 放大预览
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3)
}

// 缩小预览
const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5)
}

// 在新标签页中打开文件
const openFileInNewTab = () => {
  window.open(previewUrl.value, '_blank')
}

// 关闭预览
const closePreview = () => {
  previewDialogVisible.value = false
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  zoomLevel.value = 1 // 重置缩放级别
}

// 处理全屏变化
const handleFullscreenChange = () => {
  isFullScreen.value = !!document.fullscreenElement
}

// 添加新项
const addItem = () => {
  currentStep.value.items.push(createEmptyItem())
}

// 移除项
const removeItem = (index) => {
  currentStep.value.items.splice(index, 1)
  if (currentStep.value.items.length === 0) {
    addItem()
  }
}

// 下一步
const nextStep = async () => {
  const currentItems = currentStep.value.items
  const hasContent = currentItems.some(item => item.categoryPath.length > 0 || item.description || item.file)
  const isComplete = currentItems.every(item => item.categoryPath.length > 0 && item.description && item.file)

  if (hasContent && !isComplete) {
    const result = await ElMessageBox.confirm(
      '当前分类的信息未填写完整，是否确定跳过该分类？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).catch(() => false)

    if (!result) {
      return
    }
  }

  if (currentStepIndex.value < topLevelCategories.value.length - 1) {
    currentStepIndex.value++
    saveDraft()
    if (!formData.value[currentCategory.value] || formData.value[currentCategory.value].items.length === 0) {
      formData.value[currentCategory.value] = { items: [createEmptyItem()] }
    }
  } else {
    currentStepIndex.value = topLevelCategories.value.length
    await preparePreviewData()
  }
}

// 上一步
const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    if (!formData.value[currentCategory.value] || formData.value[currentCategory.value].items.length === 0) {
      formData.value[currentCategory.value] = { items: [createEmptyItem()] }
    }
  }
}

// 保存草稿
const saveDraft = () => {
  try {
    localStorage.setItem('reportDraft', JSON.stringify({
      currentStepIndex: currentStepIndex.value,
      formData: formData.value
    }))
    ElMessage.success('草稿已保存')
  } catch (err) {
    ElMessage.error('保存草稿失败，请重试')
  }
}

// 加载草稿
const loadDraft = () => {
  try {
    const draft = localStorage.getItem('reportDraft')
    if (draft) {
      const parsedDraft = JSON.parse(draft)
      if (parsedDraft && parsedDraft.currentStepIndex !== undefined && parsedDraft.formData) {
        currentStepIndex.value = parsedDraft.currentStepIndex
        formData.value = parsedDraft.formData
        ElMessage.success('草稿已加载')
      } else {
        initFormData()
      }
    } else {
      initFormData()
    }
  } catch (err) {
    ElMessage.error('加载草稿失败，初始化新表单')
    initFormData()
  }
}

// 提交表单
const submitForm = async () => {
  loading.value = true
  error.value = ''
  try {
    for (const category of topLevelCategories.value) {
      const items = formData.value[category]?.items || []
      for (const item of items) {
        if (item.categoryPath.length > 0 || item.description || item.file) {
          if (!item.file) {
            throw new Error(`请为 ${category} 类别上传文件`)
          }
          const response = await axios.post('/record/updatenewrecord', {
            FileID: item.fileID,
            userID: currentUser.value.StudentId,
            caseID: item.categoryCode,
            description: item.description,
            file: item.file.fileID,
            categorycode: item.categoryCode
          })
          if (response.data.statusID !== 1) {
            throw new Error(response.data.msg)
          }
        }
      }
    }
    ElMessage.success('申报提交成功')
    localStorage.removeItem('reportDraft')
    router.push('/state')
  } catch (err) {
    error.value = err.message || '提交失败，请重试'
  } finally {
    loading.value = false
  }
}

// 加载现有数据
const loadExistingData = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.post('/record/findrecord', { FileID: router.currentRoute.value.query.FileID })
    if (response.data.statusID === 0) {
      const existingData = response.data.data[0]
      const category = existingData.mainCLs
      if (!formData.value[category]) {
        formData.value[category] = { items: [] }
      }
      formData.value[category].items.push({
        categoryPath: [existingData.cls1, existingData.cls2, existingData.cls3].filter(Boolean),
        categoryCode: existingData.categorycode,
        description: existingData.description,
        file: { name: existingData.file, fileID: existingData.FileID },
        fileID: existingData.FileID,
        uploadProgress: 100,
        score: 0
      })
      currentStepIndex.value = topLevelCategories.value.indexOf(category)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (err) {
    error.value = '加载现有数据失败，请重试'
  } finally {
    loading.value = false
  }
}

// 计算分数
const calculateScores = async () => {
  for (const item of allItems.value) {
    const categoryInfo = categoryInfoRefs.value[item.categoryCode]
    if (categoryInfo) {
      await nextTick()
      item.score = await categoryInfo.getScore()
    } else {
      item.score = 0
    }
  }
}

// 准备预览数据
const preparePreviewData = async () => {
  await nextTick()
  await calculateScores()
}

// 获取类别分数
const getCategoryScore = (categoryCode) => {
  const categoryInfo = findCategoryInfo(categoryTree.value, categoryCode)
  return categoryInfo ? parseFloat(categoryInfo.topPoint) : 0
}

// 查找类别信息
const findCategoryInfo = (tree, targetCode, currentPath = []) => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value && value.caseID.toString() === targetCode.toString()) {
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

// 处理窗口大小变化
const handleResize = () => {
  // 在这里处理窗口大小变化的逻辑
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  window.addEventListener('resize', handleResize)
  currentUser.value = await authService.getCurrentUser()
  try {
    await fetchCategoryTree()
    if (isEditMode.value) {
      await loadExistingData()
    } else {
      await nextTick()
      loadDraft()
    }
    if (currentStepIndex.value === topLevelCategories.value.length) {
      await preparePreviewData()
    }
  } catch (err) {
    error.value = '初始化失败，请刷新页面重试'
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('resize', handleResize)
  closePreview()
})

watch(() => router.currentRoute.value, (newRoute) => {
  if (newRoute.query.edit) {
    isEditMode.value = true
    loadExistingData()
  }
}, { immediate: true })

watch(currentStepIndex, async (newIndex) => {
  if (newIndex === topLevelCategories.value.length) {
    await nextTick()
    await preparePreviewData()
  }
})

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
.report-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.el-steps {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}

.el-card {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-button {
  margin-right: 10px;
}

.el-divider {
  margin: 24px 0;
}

.el-alert {
  margin-bottom: 20px;
}

.el-table {
  margin-top: 20px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  height: 80vh;
}

.preview-container.fullscreen {
  height: 100vh;
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
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  position: relative;
}

.preview-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

.loading-animation {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-top: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.score-summary {
  margin-top: 20px;
  margin-bottom: 20px;
}

.category-sum {
  margin-bottom: 10px;
}

.total-score {
  margin-top: 20px;
  font-size: 18px;
  font-weight: bold;
}

.negative-score {
  color: red;
}

@media (max-width: 768px) {
  .report-form {
    padding: 10px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    margin-bottom: 10px;
    width: 100%;
  }
}
</style>