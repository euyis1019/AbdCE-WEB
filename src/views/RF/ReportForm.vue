<template>
  <div class="report-form">
    <h1>综合评价信息申报</h1>
    <el-skeleton :loading="loading" animated>
      <template #template>
        <div style="padding: 20px;">
          <el-skeleton-item variant="h3" style="width: 50%" />
          <el-skeleton-item variant="text" style="margin-top: 20px; width: 100%" />
          <el-skeleton-item variant="text" style="margin-top: 20px; width: 100%" />
        </div>
      </template>
      <template #default>
        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step v-for="category in categories" :key="category.code" :title="category.name" />
        </el-steps>
        <el-card class="form-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>{{ categories[activeStep]?.name ?? '加载中...' }}</span>
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
                  <p><strong>分数：</strong>{{ item.score }}</p>
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
            <el-button v-if="activeStep === categories.length - 1" type="success" @click="showConfirmDialog" :loading="submitting">提交申报</el-button>
            <el-button @click="saveDraft">保存草稿</el-button>
          </div>
        </el-card>
      </template>
    </el-skeleton>

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
            @change="updateScore"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="newItem.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="分数" prop="score">
          <el-input v-model="newItem.score" disabled></el-input>
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

    <el-dialog v-model="confirmDialogVisible" title="确认提交" width="50%">
      <h3>请确认以下信息：</h3>
      <el-table :data="allItems" style="width: 100%">
        <el-table-column prop="categoryName" label="类别" width="180"></el-table-column>
        <el-table-column prop="description" label="描述"></el-table-column>
        <el-table-column prop="score" label="分数" width="80"></el-table-column>
      </el-table>
      <div class="total-score">
        <h3>总分: {{ calculateTotalScore() }}</h3>
      </div>
      <el-progress :percentage="100" :format="() => ''" :duration="3000"></el-progress>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :disabled="confirmCountdown > 0">
            确认提交 ({{ confirmCountdown }}s)
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface Category {
  code: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  code: string;
  name: string;
  items: Item[];
}

interface Item {
  code: string;
  name: string;
  subitems: Subitem[];
}

interface Subitem {
  code: string;
  name: string;
  score?: number;
}

interface FormItem {
  categoryCode: string;
  description: string;
  score: number;
  files: File[];
}

interface File {
  name: string;
  url: string;
}

const categories = ref<Category[]>([])
const activeStep = ref(0)
const addItemDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const submitting = ref(false)
const uploadProgress = ref(0)
const newItemFormRef = ref<any>(null)
const confirmCountdown = ref(3)
const loading = ref(true)

const form = reactive<{ [key: string]: FormItem[] }>({})

const newItem = reactive<FormItem>({
  categoryCode: '',
  description: '',
  score: 0,
  files: []
})

const rules = {
  categoryCode: [{ required: true, message: '请选择类别', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  files: [{ required: true, message: '请上传至少一个文件', trigger: 'change' }]
}

const uploadUrl = 'http://example.com/upload'

const currentItems = computed(() => form[categories.value[activeStep.value]?.code] || [])

const currentCategoryCascaderOptions = computed(() => {
  const currentCategory = categories.value[activeStep.value]
  if (!currentCategory) return []

  return currentCategory.subcategories.map(subcategory => ({
    value: subcategory.code,
    label: subcategory.name,
    children: subcategory.items.map(item => ({
      value: item.code,
      label: item.name,
      children: item.subitems.map(subitem => ({
        value: subitem.code,
        label: subitem.name,
        score: subitem.score
      }))
    }))
  }))
})

const allItems = computed(() => {
  return Object.values(form).flat().map(item => ({
    ...item,
    categoryName: getCategoryName(item.categoryCode)
  }))
})

const showAddItemDialog = () => {
  addItemDialogVisible.value = true
  newItem.categoryCode = ''
  newItem.description = ''
  newItem.score = 0
  newItem.files = []
  uploadProgress.value = 0
}

const handleUploadSuccess = (res: any, file: any) => {
  newItem.files.push({ name: file.name, url: res.url })
  uploadProgress.value = 100
  ElMessage.success('上传成功')
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const handleUploadProgress = (event: any, file: any) => {
  uploadProgress.value = Math.round(event.percent)
}

const beforeUpload = (file: any) => {
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
    if (!form[categories.value[activeStep.value].code]) {
      form[categories.value[activeStep.value].code] = []
    }
    form[categories.value[activeStep.value].code].push({ ...newItem })
    addItemDialogVisible.value = false
    ElMessage.success('材料添加成功')
  } catch (error) {
    console.error('添加材料失败:', error)
    ElMessage.error('添加材料失败，请检查输入')
  }
}

const removeItem = (index: number) => {
  form[categories.value[activeStep.value].code].splice(index, 1)
}

const getCategoryName = (code: string) => {
  const category = categories.value.find(c => code.startsWith(c.code.slice(0, 2)))
  const subcategory = category?.subcategories.find(sc => code.startsWith(sc.code.slice(0, 4)))
  const item = subcategory?.items.find(i => code.startsWith(i.code.slice(0, 6)))
  const subitem = item?.subitems.find(si => si.code === code)
  return subitem?.name || '未知类别'
}

const calculateProgress = () => {
  const totalSteps = categories.value.length
  const completedSteps = activeStep.value
  return Math.round((completedSteps / totalSteps) * 100)
}

const nextStep = () => {
  if (activeStep.value < categories.value.length - 1) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

const showConfirmDialog = () => {
  confirmDialogVisible.value = true
  confirmCountdown.value = 3
  const timer = setInterval(() => {
    if (confirmCountdown.value > 0) {
      confirmCountdown.value--
    }
    if (confirmCountdown.value === 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const submitForm = async () => {
  if (confirmCountdown.value > 0) return

  submitting.value = true
  try {
    const submitData = allItems.value.map(item => ({
      categoryCode: item.categoryCode,
      materials: item.files.map(file => file.url),
      timestamp: Date.now(),
      description: item.description,
      score: item.score
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
    confirmDialogVisible.value = false
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

const fetchCategories = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    categories.value = [
      {
        code: "01000000",
        name: "思想品德",
        subcategories: [
          {
            code: "01010000",
            name: "思想政治",
            items: [
              {
                code: "01010100",
                name: "政治理论学习",
                subitems: [
                  {
                    code: "01010101",
                    name: "参与党团组织活动",
                    score: 5
                  },
                  {
                    code: "01010102",
                    name: "参加政治理论学习讲座",
                    score: 3
                  }
                ]
              },
              {
                code: "01010200",
                name: "社会实践",
                subitems: [
                  {
                    code: "01010201",
                    name: "参与社会调研",
                    score: 4
                  },
                  {
                    code: "01010202",
                    name: "参加志愿服务",
                    score: 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "02000000",
        name: "学业发展",
        subcategories: [
          {
            code: "02010000",
            name: "学习成绩",
            items: [
              {
                code: "02010100",
                name: "课程学习",
                subitems: [
                  {
                    code: "02010101",
                    name: "必修课程成绩",
                    score: 10
                  },
                  {
                    code: "02010102",
                    name: "选修课程成绩",
                    score: 8
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "03000000",
        name: "身心健康",
        subcategories: [
          {
            code: "03010000",
            name: "体育锻炼",
            items: [
              {
                code: "03010100",
                name: "体育活动",
                subitems: [
                  {
                    code: "03010101",
                    name: "参加体育比赛",
                    score: 6
                  },
                  {
                    code: "03010102",
                    name: "日常体育锻炼",
                    score: 3
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "04000000",
        name: "艺术素养",
        subcategories: [
          {
            code: "04010000",
            name: "艺术实践",
            items: [
              {
                code: "04010100",
                name: "艺术活动",
                subitems: [
                  {
                    code: "04010101",
                    name: "参加艺术表演",
                    score: 7
                  },
                  {
                    code: "04010102",
                    name: "艺术作品创作",
                    score: 5
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "05000000",
        name: "社会实践",
        subcategories: [
          {
            code: "05010000",
            name: "社会服务",
            items: [
              {
                code: "05010100",
                name: "志愿服务",
                subitems: [
                  {
                    code: "05010101",
                    name: "校内志愿服务",
                    score: 4
                  },
                  {
                    code: "05010102",
                    name: "校外志愿服务",
                    score: 3
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
    // 实际的API调用可能如下：
    // const response = await axios.get('/api/categories', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   categories.value = response.data.categories
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (error) {
    console.error('获取类别数据失败:', error)
    ElMessage.error('获取类别数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const updateScore = () => {
  const selectedCategory = categories.value[activeStep.value]
  const selectedSubcategory = selectedCategory?.subcategories.find(sc => newItem.categoryCode.startsWith(sc.code))
  const selectedItem = selectedSubcategory?.items.find(i => newItem.categoryCode.startsWith(i.code))
  const selectedSubitem = selectedItem?.subitems.find(si => si.code === newItem.categoryCode)
  newItem.score = selectedSubitem?.score || 0
}

const calculateTotalScore = () => {
  return allItems.value.reduce((total, item) => total + item.score, 0)
}

watch(confirmDialogVisible, (newValue) => {
  if (newValue) {
    confirmCountdown.value = 3
    const timer = setInterval(() => {
      if (confirmCountdown.value > 0) {
        confirmCountdown.value--
      }
      if (confirmCountdown.value === 0) {
        clearInterval(timer)
      }
    }, 1000)
  }
})

onMounted(() => {
  fetchCategories()
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

.total-score {
  margin-top: 20px;
  text-align: right;
  font-size: 18px;
  font-weight: bold;
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
