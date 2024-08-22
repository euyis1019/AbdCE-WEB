<template>
  <div class="report-form">
    <h1>{{ isEditMode ? '修改申报' : '综合评价信息申报' }}</h1>
    
    <el-steps :active="activeCategory" finish-status="success">
      <el-step v-for="category in topLevelCategories" :key="category" :title="category" />
    </el-steps>
    
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" @submit.prevent="submitForm">
      <el-form-item label="类别" prop="category">
        <el-select v-model="form.category[0]" placeholder="选择主类别" @change="handleMainCategoryChange">
          <el-option v-for="cat in categoryOptions" :key="cat.value" :label="cat.label" :value="cat.value" />
        </el-select>
        <el-select v-if="form.category[0]" v-model="form.category[1]" placeholder="选择子类别" @change="handleSubCategoryChange">
          <el-option v-for="cat in subCategoryOptions" :key="cat.value" :label="cat.label" :value="cat.value" />
        </el-select>
        <el-select v-if="form.category[1]" v-model="form.category[2]" placeholder="选择具体项目">
          <el-option v-for="cat in itemOptions" :key="cat.value" :label="cat.label" :value="cat.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3"></el-input>
      </el-form-item>

      <el-form-item label="上传文件" prop="file">
        <el-upload
          class="upload-demo"
          :action="uploadUrl"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :on-progress="handleUploadProgress"
          :headers="uploadHeaders"
        >
          <el-button size="small" type="primary">点击上传</el-button>
        </el-upload>
        <el-progress v-if="uploadProgress > 0 && uploadProgress < 100" :percentage="uploadProgress"></el-progress>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" native-type="submit">提交</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
      </el-form-item>
    </el-form>
    
    <el-table :data="materials" style="width: 100%">
      <el-table-column prop="category" label="类别">
        <template #default="scope">
          <CategoryInfo :categoryCode="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
      <el-table-column prop="file" label="文件"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button @click="editMaterial(scope.$index)" type="text" size="small">编辑</el-button>
          <el-button @click="removeMaterial(scope.$index)" type="text" size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router' // 引入 useRouter
import { ElMessage, ElMessageBox } from 'element-plus'
import CategoryInfo from '@/components/CategoryInfo.vue'
import axios from '@/http-common'

const router = useRouter() // 使用 useRouter
const isEditMode = ref(false)
const activeCategory = ref(0)
const formRef = ref(null)
const form = ref({
  category: [],
  description: '',
  file: null
})
const uploadProgress = ref(0)
const uploadUrl = computed(() => `${process.env.VUE_APP_API_URL}record/upload`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('jwt_token')
  return { Authorization: `Bearer ${token}` }
})

const materials = ref([])
const categoryTree = ref({})
const categoryOptions = ref([])
const subCategoryOptions = ref([])
const itemOptions = ref([])

const rules = {
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  file: [{ required: true, message: '请上传文件', trigger: 'change' }]
}

const topLevelCategories = computed(() => {
  return Object.keys(categoryTree.value).filter(cat => cat !== 'Main Category')
})

onMounted(async () => {
  await fetchCategoryTree()
  if (isEditMode.value) {
    await loadExistingData()
  } else {
    loadDraft()
  }
})

// 监听路由变化
watch(() => router.currentRoute.value, (newRoute) => {
  if (newRoute.query.edit) {
    isEditMode.value = true
    loadExistingData()
  }
}, { immediate: true })

const fetchCategoryTree = async () => {
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryTree.value = response.data.data
      categoryOptions.value = Object.keys(categoryTree.value)
        .filter(cat => cat !== 'Main Category')
        .map(cat => ({ label: cat, value: cat }))
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取类别树失败:', error)
    ElMessage.error('获取类别数据失败，请稍后重试')
  }
}

const handleMainCategoryChange = (value) => {
  form.value.category = [value]
  subCategoryOptions.value = Object.keys(categoryTree.value[value]).map(cat => ({ label: cat, value: cat }))
  itemOptions.value = []
}

const handleSubCategoryChange = (value) => {
  form.value.category = form.value.category.slice(0, 2).concat(value)
  const mainCategory = form.value.category[0]
  const subCategory = value
  itemOptions.value = Object.keys(categoryTree.value[mainCategory][subCategory]).map(cat => ({ label: cat, value: cat }))
}

const handleUploadSuccess = (res, file) => {
  if (res.statusID === 1) {
    form.value.file = { name: res.fileName, url: res.fileURL }
    uploadProgress.value = 100
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
}

const handleUploadError = (error) => {
  console.error('文件上传失败:', error)
  ElMessage.error('文件上传失败，请重试')
}

const handleUploadProgress = (event) => {
  uploadProgress.value = Math.round(event.percent)
}

const beforeUpload = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
  }
  return isLt10M
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    console.log('Submitting form:', form.value)
    // 调用后端 API 提交表单数据
    const response = await axios.post('/record/newrecord', {
      userID: localStorage.getItem('userID'),
      caseID: form.value.category[2],
      description: form.value.description,
      file: form.value.file.url
    })
    if (response.data.statusID === 1) {
      ElMessage.success('表单提交成功')
      resetForm()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('提交失败，请重试')
  }
}

const saveDraft = () => {
  localStorage.setItem('reportDraft', JSON.stringify(form.value))
  ElMessage.success('草稿已保存')
}

const loadExistingData = async () => {
  try {
    const response = await axios.post('/case/findcase', { caseID: 'your_case_id_here' })
    if (response.data.statusID === 0) {
      const existingData = response.data.data[0]
      form.value = {
        category: [existingData.mainCLs, existingData.cls1, existingData.cls2],
        description: existingData.judgment,
        file: existingData.file
      }
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('加载现有数据失败:', error)
    ElMessage.error('加载现有数据失败，请重试')
  }
}

const editMaterial = (index) => {
  const material = materials.value[index]
  form.value = {
    category: material.category.split(' > '),
    description: material.description,
    file: material.file,
  }
}

const removeMaterial = (index) => {
  ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    materials.value.splice(index, 1)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除操作
  })
}

const loadDraft = () => {
  const draft = localStorage.getItem('reportDraft')
  if (draft) {
    form.value = JSON.parse(draft)
    ElMessage.success('草稿已加载')
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.value = {
    category: [],
    description: '',
    file: null
  }
  uploadProgress.value = 0
}

// Watch for route changes to handle navigation from progress inquiry page
watch(() => router.currentRoute.value, (newRoute) => {
  if (newRoute.query.edit) {
    isEditMode.value = true
    loadExistingData()
  }
}, { immediate: true })
</script>

<style scoped>
.report-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-steps {
  margin-bottom: 20px;
}

.el-form {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.upload-demo {
  margin-top: 10px;
}

.el-table {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .report-form {
    padding: 10px;
  }
}
</style>
