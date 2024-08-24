<template>
  <div class="report-form">
    <h1>{{ isEditMode ? '修改申报' : '综合评价信息申报' }}</h1>

    <el-steps :active="currentStepIndex" finish-status="success">
      <el-step 
        v-for="(category, index) in topLevelCategories" 
        :key="index" 
        :title="category" 
      />
      <el-step title="预览">
        <template #icon>
          <el-icon><Document /></el-icon>
        </template>
      </el-step>
    </el-steps>

    <el-card v-loading="loading" element-loading-text="加载中...">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        @close="error = ''"
      />

      <div v-if="debug">
      </div>

      <template v-if="!loading && topLevelCategories.length > 0">
        <el-form 
          v-if="currentStepIndex < topLevelCategories.length" 
          :model="currentStep" 
          ref="formRef" 
          label-width="120px"
        >
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
                :action="uploadUrl"
                :on-success="(res, file) => handleUploadSuccess(res, file, index)"
                :on-error="handleUploadError"
                :before-upload="file => beforeUpload(file, index)"
                :on-progress="(event, file) => handleUploadProgress(event, file, index)"
                :headers="uploadHeaders"
                :data="{ fileID: item.fileID, userID: currentUser.ID, caseID: item.categoryCode }"
                :disabled="!item.fileID"
              >
                <el-button size="small" type="primary" :disabled="!item.fileID">点击上传</el-button>
              </el-upload>
              <el-progress v-if="item.uploadProgress > 0 && item.uploadProgress < 100" :percentage="item.uploadProgress"></el-progress>
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
                <CategoryInfo 
                  :categoryCode="scope.row.categoryCode" 
                  :ref="el => { if (el) categoryInfoRefs[scope.row.categoryCode] = el }"
                />
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

const router = useRouter()
const formRef = ref(null)
const isEditMode = ref(false)
const currentUser = ref(authService.getCurrentUser())
const loading = ref(false)
const error = ref('')
const debug = ref(true) // 设置为 true 以显示调试信息

// 状态管理
const topLevelCategories = ref([])
const categoryData = ref(null)
const currentStepIndex = ref(0)
const formData = ref({})
const categoryInfoRefs = ref({})

// 计算属性
const currentCategory = computed(() => {
  console.log('Computing currentCategory:', topLevelCategories.value[currentStepIndex.value])
  return topLevelCategories.value[currentStepIndex.value] || ''
})

const currentStep = computed(() => {
  const category = currentCategory.value
  console.log('Computing currentStep for category:', category)
  return category && formData.value[category] ? formData.value[category] : { items: [] }
})

const categoryOptions = computed(() => {
  console.log('Computing categoryOptions for category:', currentCategory.value)
  return getCategoryOptions(currentCategory.value)
})

const allItems = computed(() => {
  console.log('Computing allItems')
  return Object.values(formData.value).flatMap(step => 
    step.items.filter(item => item.categoryPath.length > 0 || item.description || item.file)
  )
})

const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}record/upload`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('jwt_token')}`
}))

// 方法
const fetchCategoryTree = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('Fetching category tree')
    const response = await axios.get('/case/categorytree')
    console.log('Category tree response:', response.data)
    if (response.data.statusID === 0) {
      categoryData.value = response.data.data
      console.log('Category data:', categoryData.value)
      topLevelCategories.value = Object.keys(categoryData.value).filter(key => key !== 'Main Category')
      console.log('Top level categories:', topLevelCategories.value)
      initFormData()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (err) {
    console.error('获取类别树失败:', err)
    error.value = '获取类别数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const initFormData = () => {
  console.log('Initializing form data')
  topLevelCategories.value.forEach(category => {
    if (!formData.value[category]) {
      formData.value[category] = { items: [createEmptyItem()] }
    }
  })
  console.log('Initialized form data:', formData.value)
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
  console.log('Category changed:', value, 'for index:', index)
  const item = currentStep.value.items[index]
  item.categoryCode = value[value.length - 1]
  await createCaseFile(item)
}

const createCaseFile = async (item) => {
  if (!item.categoryCode) return

  loading.value = true
  error.value = ''
  try {
    console.log('Creating case file for:', item)
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

    console.log('Case file creation response:', response.data)
    if (response.data.statusID === 1) {
      item.fileID = response.data.fileID
      ElMessage.success('案例文件创建成功，可以上传文件了')
    } else {
      throw new Error(response.data.msg)
    }
  } catch (err) {
    console.error('创建案例文件失败:', err)
    error.value = '创建案例文件失败，请重试'
  } finally {
    loading.value = false
  }
}

const handleUploadSuccess = (res, file, index) => {
  console.log('Upload success:', res, 'for file:', file.name, 'at index:', index)
  if (res.statusID === 1) {
    currentStep.value.items[index].file = { name: file.name, url: res.fileURL }
    currentStep.value.items[index].uploadProgress = 100
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
}

const handleUploadError = (error) => {
  console.error('文件上传失败:', error)
  ElMessage.error('文件上传失败，请重试')
}

const handleUploadProgress = (event, file, index) => {
  currentStep.value.items[index].uploadProgress = Math.round(event.percent)
}

const beforeUpload = (file, index) => {
  const item = currentStep.value.items[index]
  if (!item.fileID) {
    ElMessage.error('请先选择完整的类别')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
  }
  return isLt10M
}

const addItem = () => {
  console.log('Adding new item')
  currentStep.value.items.push(createEmptyItem())
}

const removeItem = (index) => {
  console.log('Removing item at index:', index)
  currentStep.value.items.splice(index, 1)
  if (currentStep.value.items.length === 0) {
    addItem()
  }
}

const nextStep = async () => {
  const currentItems = currentStep.value.items
  const hasContent = currentItems.some(item => 
    item.categoryPath.length > 0 || item.description || item.file
  )
  const isComplete = currentItems.every(item => 
    item.categoryPath.length > 0 && item.description && item.file
  )

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
    // 如果下一步没有数据，初始化一个空项
    if (!formData.value[currentCategory.value] || formData.value[currentCategory.value].items.length === 0) {
      formData.value[currentCategory.value] = { items: [createEmptyItem()] }
    }
  } else {
    // 进入预览步骤
    currentStepIndex.value = topLevelCategories.value.length
    await preparePreviewData()
  }
  console.log('Moving to next step:', currentStepIndex.value)
}

const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    console.log('Moving to previous step:', currentStepIndex.value)
    // 如果前一步没有数据，初始化一个空项
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
    console.log('Draft saved')
    ElMessage.success('草稿已保存')
  } catch (err) {
    console.error('保存草稿失败:', err)
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
        console.log('Draft loaded:', parsedDraft)
        ElMessage.success('草稿已加载')
      } else {
        console.warn('Invalid draft data, initializing new form')
        initFormData()
      }
    } else {
      console.log('No draft found, initializing new form')
      initFormData()
    }
  } catch (err) {
    console.error('加载草稿失败:', err)
    ElMessage.error('加载草稿失败，初始化新表单')
    initFormData()
  }
}

const submitForm = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('Submitting form')
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
          console.log('Update record response:', response.data)
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
    console.error('提交表单失败:', err)
    error.value = err.message || '提交失败，请重试'
  } finally {
    loading.value = false
  }
}

const loadExistingData = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('Loading existing data')
    const response = await axios.post('/record/findrecord', { FileID: router.currentRoute.value.query.FileID })
    console.log('Existing data response:', response.data)
    if (response.data.statusID === 0) {
      const existingData = response.data.data[0]
      // 根据现有数据初始化表单
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
      console.log('Existing data loaded:', formData.value)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (err) {
    console.error('加载现有数据失败:', err)
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
  console.log('Preview data prepared, scores calculated:', allItems.value)
}

// 生命周期钩子
onMounted(async () => {
  console.log('Component mounted')
  try {
    await fetchCategoryTree()
    console.log('Category tree fetched')
    if (isEditMode.value) {
      await loadExistingData()
      console.log('Existing data loaded')
    } else {
      await nextTick() // 确保类别树数据已经反应到模板中
      loadDraft()
      console.log('Draft loaded')
    }
    if (currentStepIndex.value === topLevelCategories.value.length) {
      await preparePreviewData()
    }
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = '初始化失败，请刷新页面重试'
  }
})
// 监听路由变化
watch(() => router.currentRoute.value, (newRoute) => {
  if (newRoute.query.edit) {
    isEditMode.value = true
    loadExistingData()
  }
}, { immediate: true })

// 监听 currentStepIndex 变化
watch(currentStepIndex, async (newIndex) => {
  if (newIndex === topLevelCategories.value.length) {
    console.log('Entered preview step')
    await nextTick()
    await preparePreviewData()
  }
})

// 错误处理函数
const handleError = (error, message) => {
  console.error(message, error)
  ElMessage.error(message)
}

// 全局错误处理
window.addEventListener('error', (event) => {
  handleError(event.error, '发生了意外错误，请刷新页面重试')
})

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason, '发生了未处理的异步错误，请刷新页面重试')
})

// 导出组件需要的方法和响应式数据
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

