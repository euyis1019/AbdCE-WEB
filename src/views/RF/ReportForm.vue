<template>
  <div class="report-form">
    <h1>综合评价信息申报</h1>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" @submit.prevent="submitForm">
      <el-tabs v-model="activeTab">
        <el-tab-pane v-for="category in categories" :key="category.value" :label="category.label" :name="category.value">
          <el-button type="primary" @click="addItem(category.value)">添加项目</el-button>
          <el-table :data="form[category.value]" style="width: 100%">
            <el-table-column label="描述" prop="description">
              <template #default="scope">
                <el-input v-model="scope.row.description"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="分数" prop="score" width="150">
              <template #default="scope">
                <el-input-number v-model="scope.row.score" :min="0" :max="100"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="材料" prop="material" width="250">
              <template #default="scope">
                <el-upload
                  :action="uploadUrl"
                  :on-success="(res) => handleUploadSuccess(res, scope.row)"
                  :on-error="handleUploadError"
                  :before-upload="beforeUpload"
                  :on-progress="(event, file) => handleUploadProgress(event, file, scope.row)"
                >
                  <el-button size="small" type="primary">上传材料</el-button>
                </el-upload>
                <el-progress v-if="scope.row.uploadProgress > 0 && scope.row.uploadProgress < 100" 
                             :percentage="scope.row.uploadProgress"></el-progress>
                <span v-if="scope.row.materialUrl">已上传</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="danger" @click="removeItem(category.value, scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
      <el-divider>申报总结</el-divider>
      
      <div class="summary">
        <h3>申报总结</h3>
        <div v-for="category in categories" :key="category.value">
          <h4>{{ category.label }}</h4>
          <p>项目数: {{ form[category.value].length }}</p>
          <p>总分: {{ calculateTotalScore(category.value) }}</p>
        </div>
        <p><strong>总评分: {{ calculateOverallScore() }}</strong></p>
      </div>
      
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="submitting">提交申报</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const formRef = ref(null)
const activeTab = ref('morality')
const submitting = ref(false)

const categories = [
  { label: '思想品德', value: 'morality' },
  { label: '学业发展', value: 'academic' },
  { label: '身心健康', value: 'physical' },
  { label: '艺术素养', value: 'art' },
  { label: '社会实践', value: 'social' }
]

const form = reactive({
  morality: [],
  academic: [],
  physical: [],
  art: [],
  social: []
})

const rules = {
  // Add validation rules here
}

// 模拟上传URL，实际使用时替换为真实的上传接口
const uploadUrl = 'http://example.com/upload'

// 实际的上传接口可能如下：
// const uploadUrl = `${baseURL}/report/upload?t=${localStorage.getItem('token')}&ID=${localStorage.getItem('ID')}`

const addItem = (category) => {
  form[category].push({
    description: '',
    score: 0,
    materialUrl: '',
    uploadProgress: 0
  })
}

const removeItem = (category, index) => {
  form[category].splice(index, 1)
}

const handleUploadSuccess = (res, item) => {
  // 模拟上传成功响应
  item.materialUrl = `http://example.com/uploads/${Date.now()}`
  item.uploadProgress = 100
  ElMessage.success('上传成功')

  // 实际上传成功处理可能如下：
  // if (res.res_code === 0) {
  //   item.materialUrl = res.url
  //   item.uploadProgress = 100
  //   ElMessage.success('上传成功')
  // } else {
  //   ElMessage.error('上传失败：' + res.msg)
  // }
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const handleUploadProgress = (event, file, item) => {
  item.uploadProgress = Math.round(event.percent)
}

const beforeUpload = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
  }
  return isLt10M
}

const calculateTotalScore = (category) => {
  return form[category].reduce((total, item) => total + (item.score || 0), 0)
}

const calculateOverallScore = () => {
  return categories.reduce((total, category) => total + calculateTotalScore(category.value), 0)
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 实际的API调用可能如下：
    // const response = await axios.post('/report/new', {
    //   userID: localStorage.getItem('ID'),
    //   items: categories.flatMap(category => 
    //     form[category.value].map(item => ({
    //       categoryCode: category.value,
    //       materials: item.materialUrl,
    //       timestamp: Date.now(),
    //       description: item.description,
    //       score: item.score
    //     }))
    //   )
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

.el-table {
  margin-top: 20px;
}

.el-button {
  margin-top: 20px;
}

.summary {
  background-color: #f0f9eb;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .report-form {
    padding: 10px;
  }
  
  .el-form-item {
    margin-bottom: 10px;
  }
}
</style>