<template>
  <div class="report-form">
    <h1>{{ isEditMode ? '修改申报' : '综合评价信息申报' }}</h1>

    <el-steps :active="currentStepIndex" finish-status="success">
      <el-step v-for="(category, index) in topLevelCategories" :key="index" :title="category" />
      <el-step title="预览">
        <template #icon>
          <el-icon><Document /></el-icon>
        </template>
      </el-step>
    </el-steps>

    <el-card v-loading="loading" element-loading-text="加载中...">
      <el-alert v-if="error" :title="error" type="error" show-icon @close="error = ''" />

      <div v-if="debug">
      </div>

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
                <el-button size="small" type="primary" @click="previewFile(item.file.url)">预览文件</el-button>
              </div>
            </el-form-item>
            <el-button type="danger" @click="removeItem(index)" v-if="currentStep.items.length > 1">删除此项</el-button>
          </div>
          <el-button type="primary" @click="addItem">添加新项</el-button>
          <div class="form-actions">
            <el-button @click="prevStep" v-if="currentStepIndex > 0">上一步</el-button>
            <el-button type="primary" @click="nextStep">{{ currentStepIndex === topLevelCategories.length - 1 ? '预览' : '下一步' }}</el-button>
            <el-button @click="saveDraft">保存草稿</el-button>
          </div>
        </el-form>
        <div v-else-if="currentStepIndex === topLevelCategories.length">
          <h2>预览</h2>
          <el-table :data="allItems" style="width: 100%">
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
          </el-table>
          <div class="form-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="submitForm">提交申报</el-button>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无数据"></el-empty>
    </el-card>

    <el-dialog v-model="previewDialogVisible" title="文件预览" width="80%">
      <iframe :src="previewUrl" style="width: 100%; height: 600px;"></iframe>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import axios from '@/http-common'
import authService from '@/services/authService'
import CategoryInfo from '@/components/CategoryInfo.vue'
import Cookies from 'js-cookie'

const formRef = ref(null)
const isEditMode = ref(false)
const currentUser = ref(null)
const loading = ref(false)
const error = ref('')
const previewUrl = ref('')
const previewDialogVisible = ref(false)
const debug = ref(true)

const topLevelCategories = ref([])
const categoryData = ref(null)
const currentStepIndex = ref(0)
const formData = ref({})
const categoryInfoRefs = ref({})

const router = useRouter()

const currentCategory = computed(() => topLevelCategories.value[currentStepIndex.value] || '')
const currentStep = computed(() => (currentCategory.value && formData.value[currentCategory.value]) ? formData.value[currentCategory.value] : { items: [] })
const categoryOptions = computed(() => getCategoryOptions(currentCategory.value))
const allItems = computed(() => Object.values(formData.value).flatMap(step => step.items.filter(item => item.categoryPath.length > 0 || item.description || item.file)))
const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}record/upload`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${Cookies.get('jwt_token')}`
}))

// 新增：用于跟踪正在上传的文件
const uploadingFiles = ref(new Set())

const fetchCategoryTree = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryData.value = response.data.data
      topLevelCategories.value = Object.keys(categoryData.value).filter(key => key !== 'Main Category')
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

const initFormData = () => {
  topLevelCategories.value.forEach(category => {
    if (!formData.value[category]) {
      formData.value[category] = { items: [createEmptyItem()] }
    }
  })
}

const createEmptyItem = () => ({
  categoryPath: [],
  categoryCode: '',
  description: '',
  file: null,
  fileID: '',
  uploadProgress: 0,
  score: 0
})

const getCategoryOptions = (topCategory) => {
  if (!categoryData.value || !topCategory) return []
  const categoryTree = categoryData.value[topCategory]
  return convertTreeToOptions(categoryTree)
}

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

const handleCategoryChange = async (value, index) => {
  const item = currentStep.value.items[index]
  item.categoryCode = value[value.length - 1]
  await createCaseFile(item)
}

const createCaseFile = async (item) => {
  if (!item.categoryCode) return

  loading.value = true
  error.value = ''
  try {
    const response = await axios.post('/record/newrecord', {
      userID: currentUser.value.ID,
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

// 修改：更新 beforeUpload 函数
const beforeUpload = (file, index) => {
  const item = currentStep.value.items[index]
  if (!item.fileID) {
    ElMessage.error('请先选择完整的类别')
    return false
  }
  // 新增：检查文件是否正在上传
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

// 修改：更新 customUpload 函数
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
    
    // 修改：确保只在成功时调用 onSuccess
    if (response.data && response.data.statusID === 1) {
      onSuccess(response.data)
    } else {
      throw new Error(response.data.msg || '上传失败')
    }
  } catch (error) {
    console.error('Upload error:', error)
    onError(error)
  } finally {
    uploadingFiles.value.delete(file.name)
  }
}

// 修改：更新 handleUploadSuccess 函数
const handleUploadSuccess = (res, file, index) => {
  console.log('Upload response:', res)

  if (res && res.statusID === 1) {
    currentStep.value.items[index].file = { name: file.name, url: res.fileURL }
    currentStep.value.items[index].uploadProgress = 100
    ElMessage.success('上传成功')
  } else if (res === undefined) {
    // 新增：忽略未定义的响应
    console.warn('Received undefined response in handleUploadSuccess')
    return
  } else {
    console.error('Upload failed:', res)
    ElMessage.error(res && res.msg || '上传失败，请重试')
    currentStep.value.items[index].uploadProgress = 0
  }
}

const handleUploadError = (error) => {
  console.error('Upload error:', error)
  ElMessage.error('文件上传失败，请重试')
}

const previewFile = (url) => {
  previewUrl.value = url
  previewDialogVisible.value = true
}

const addItem = () => {
  currentStep.value.items.push(createEmptyItem())
}

const removeItem = (index) => {
  currentStep.value.items.splice(index, 1)
  if (currentStep.value.items.length === 0) {
    addItem()
  }
}

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

const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    if (!formData.value[currentCategory.value] || formData.value[currentCategory.value].items.length === 0) {
      formData.value[currentCategory.value] = { items: [createEmptyItem()] }
    }
  }
}

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
            userID: currentUser.value.ID,
            caseID: item.categoryCode,
            description: item.description,
            file: item.file.url,
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
        file: { name: existingData.file, url: existingData.file },
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

const getFullCategoryPath = (item) => {
  return [currentCategory.value, ...item.categoryPath].join(' > ')
}

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

const preparePreviewData = async () => {
  await nextTick()
  await calculateScores()
}

onMounted(async () => {
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

// 新增：全局错误处理函数
const handleError = (error, message) => {
  console.error('Error:', error)
  ElMessage.error(message)
}

// 新增：全局错误监听
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
      