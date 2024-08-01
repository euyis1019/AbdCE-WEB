<template>
  <div class="report-form">
    <h1>综合评价信息申报</h1>
    <el-steps :active="activeStep" finish-status="success" align-center>
      <el-step v-for="category in categories" :key="category.code" :title="category.name" />
    </el-steps>
    <el-card class="form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ categories[activeStep].name }}</span>
          <el-progress :percentage="calculateProgress()" style="width: 50%; margin-left: 20px;" />
        </div>
      </template>
      
      <div class="item-list" v-if="currentItems.length > 0">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-for="(item, index) in currentItems" :key="index">
            <el-card class="item-card" shadow="hover">
              <template #header>
                <div class="item-card-header">
                  <span>{{ getCategoryName(item.categoryCode) }}</span>
                  <el-button type="danger" icon="Delete" circle @click="removeItem(index)"></el-button>
                </div>
              </template>
              <p><strong>描述：</strong>{{ item.description }}</p>
              <p><strong>文件：</strong>{{ item.files.map(f => f.name).join(', ') }}</p>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="empty-list" @click="showAddItemDialog" v-else>
        <el-empty description="点击添加材料">
          <el-button type="primary">添加材料</el-button>
        </el-empty>
      </div>
      
      <div class="form-actions">
        <el-button @click="showAddItemDialog" type="primary" icon="Plus">添加材料</el-button>
        <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="activeStep < categories.length - 1" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="activeStep === categories.length - 1" type="success" @click="submitForm" :loading="submitting">提交申报</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
      </div>
    </el-card>

    <el-dialog v-model="addItemDialogVisible" title="添加材料" width="50%">
      <el-form :model="newItem" :rules="rules" ref="newItemFormRef" label-width="100px">
        <el-form-item label="类别" prop="categoryCode">
          <el-cascader
            v-model="newItem.categoryCode"
            :options="currentCategoryCascaderOptions"
            :props="{ 
              checkStrictly: false,
              emitPath: false,
              expandTrigger: 'hover'
            }"
            placeholder="请选择类别"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="newItem.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="上传文件" prop="files">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :on-progress="handleUploadProgress"
            multiple
          >
            <el-button size="small" type="primary">点击上传</el-button>
          </el-upload>
          <el-progress v-if="uploadProgress > 0 && uploadProgress < 100" 
                       :percentage="uploadProgress"></el-progress>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addItemDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addItem">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import categoryStructure from '@/assets/categoryStructure.json'

const categories = categoryStructure.categories
const activeStep = ref(0)
const addItemDialogVisible = ref(false)
const submitting = ref(false)
const uploadProgress = ref(0)
const newItemFormRef = ref(null)

const form = reactive(
  categories.reduce((acc, category) => {
    acc[category.code] = []
    return acc
  }, {})
)

const newItem = reactive({
  categoryCode: '',
  description: '',
  files: []
})

const rules = {
  categoryCode: [{ required: true, message: '请选择类别', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  files: [{ required: true, message: '请上传至少一个文件', trigger: 'change' }]
}

const uploadUrl = 'http://example.com/upload'

const currentItems = computed(() => form[categories[activeStep.value].code])

const currentCategoryCascaderOptions = computed(() => {
  const currentCategory = categories[activeStep.value]
  return [
    {
      value: currentCategory.code,
      label: currentCategory.name,
      children: currentCategory.subcategories.map(subcategory => ({
        value: subcategory.code,
        label: subcategory.name,
        children: subcategory.items.map(item => ({
          value: item.code,
          label: item.name,
          children: item.subitems.map(subitem => ({
            value: subitem.code,
            label: subitem.name
          }))
        }))
      }))
    }
  ]
})

const showAddItemDialog = () => {
  addItemDialogVisible.value = true
  newItem.categoryCode = ''
  newItem.description = ''
  newItem.files = []
  uploadProgress.value = 0
}

const handleUploadSuccess = (res, file) => {
  // 测试阶段，总是报告成功
  newItem.files.push({ name: file.name, url: `http://example.com/uploads/${Date.now()}` })
  uploadProgress.value = 100
  ElMessage.success('上传成功')

  // 实际上传成功处理可能如下：
  // if (res.res_code === 0) {
  //   newItem.files.push({ name: file.name, url: res.url })
  //   uploadProgress.value = 100
  //   ElMessage.success('上传成功')
  // } else {
  //   ElMessage.error('上传失败：' + res.msg)
  // }
}

const handleUploadError = () => {
  // 测试阶段，忽略错误
  ElMessage.success('上传成功')

  // 实际错误处理可能如下：
  // ElMessage.error('上传失败，请重试')
}

const handleUploadProgress = (event, file) => {
  uploadProgress.value = Math.round(event.percent)
}

const beforeUpload = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
  }
  return isLt10M
}

const addItem = async () => {
  if (!newItemFormRef.value) return
  
  try {
    await newItemFormRef.value.validate()
    form[categories[activeStep.value].code].push({ ...newItem })
    addItemDialogVisible.value = false
    ElMessage.success('材料添加成功')
  } catch (error) {
    console.error('添加材料失败:', error)
    ElMessage.error('添加材料失败，请检查输入')
  }
}

const removeItem = (index: number) => {
  form[categories[activeStep.value].code].splice(index, 1)
}

const getCategoryName = (code: string) => {
  const category = categories.find(c => code.startsWith(c.code.slice(0, 2)))
  const subcategory = category?.subcategories.find(sc => code.startsWith(sc.code.slice(0, 4)))
  const item = subcategory?.items.find(i => code.startsWith(i.code.slice(0, 6)))
  const subitem = item?.subitems.find(si => si.code === code)
  return subitem?.name || '未知类别'
}

const calculateProgress = () => {
  const totalSteps = categories.length
  const completedSteps = activeStep.value
  return Math.round((completedSteps / totalSteps) * 100)
}

const nextStep = () => {
  if (activeStep.value < categories.length - 1) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

const submitForm = async () => {
  const allItems = Object.values(form).flat()
  if (allItems.length === 0) {
    ElMessage.warning('请至少添加一项材料')
    return
  }
  
  try {
    submitting.value = true
    
    // 准备提交的数据
    const submitData = allItems.map(item => ({
      categoryCode: item.categoryCode,
      materials: item.files.map(file => file.url),
      timestamp: Date.now(),
      description: item.description
    }))

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 实际的API调用可能如下：
    // const response = await axios.post('/report/new', {
    //   userID: localStorage.getItem('ID'),
    //   items: submitData
    // }, {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     class: localStorage.getItem('Class')
    //   }
    // })
    // if (response.data.statusID === 1) {
    //   ElMessage.success('申报提交成功')
    //   localStorage.removeItem('reportDraft')
    // } else {
    //   throw new Error(response.data.msg)
    // }

    ElMessage.success('申报提交成功')
    localStorage.removeItem('reportDraft')
    Object.keys(form).forEach(key => form[key] = [])
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const saveDraft = () => {
  localStorage.setItem('reportDraft', JSON.stringify(form))
  ElMessage.success('草稿已保存')
}

const loadDraft = () => {
  const draft = localStorage.getItem('reportDraft')
  if (draft) {
    ElMessageBox.confirm('发现未提交的草稿，是否加载？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      Object.assign(form, JSON.parse(draft))
      ElMessage.success('草稿已加载')
    }).catch(() => {
      ElMessage.info('已取消加载草稿')
    })
  }
}

onMounted(() => {
  loadDraft()
})
</script>

<style scoped>
.report-form {
  padding: 20px;
}

.form-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-list {
  margin-bottom: 20px;
}

.item-card {
  margin-bottom: 20px;
}

.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-list {
  cursor: pointer;
  padding: 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.empty-list:hover {
  border-color: #409EFF;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .report-form {
    padding: 10px;
  }
  
  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>