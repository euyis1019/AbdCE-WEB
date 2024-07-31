<template>
  <div class="report-form">
    <h1>综合评价信息申报</h1>
    <el-steps :active="activeStep" finish-status="success" align-center>
      <el-step v-for="(category, index) in categories" :key="index" :title="category.label" />
    </el-steps>
    <el-card class="form-card" shadow="hover">
  <template #header>
    <div class="card-header">
      <span>{{ categories[activeStep].label }}</span>
      <el-progress :percentage="calculateProgress()" style="width: 50%; margin-left: 20px;" />
    </div>
  </template>
  
  <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" @submit.prevent="submitForm">
    <transition name="fade" mode="out-in">
      <div :key="activeStep">
        <el-form-item 
          v-for="(item, index) in form[categories[activeStep].value]" 
          :key="index"
          :label="`项目 ${index + 1}`"
        >
          <el-input v-model="item.description" placeholder="请输入项目描述"></el-input>
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="(res) => handleUploadSuccess(res, item)"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :on-progress="(event, file) => handleUploadProgress(event, file, item)"
          >
            <el-button size="small" type="primary">上传材料</el-button>
          </el-upload>
          <el-progress v-if="item.uploadProgress > 0 && item.uploadProgress < 100" 
                       :percentage="item.uploadProgress"></el-progress>
          <span v-if="item.materialUrl">已上传: {{ item.materialUrl }}</span>
        </el-form-item>
      </div>
    </transition>
    
    <el-form-item>
      <el-button type="primary" @click="addItem">添加项目</el-button>
      <el-button @click="removeItem" :disabled="form[categories[activeStep].value].length <= 1">删除最后一项</el-button>
    </el-form-item>
    
    <el-form-item>
      <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
      <el-button v-if="activeStep < categories.length - 1" type="primary" @click="nextStep">下一步</el-button>
      <el-button v-if="activeStep === categories.length - 1" type="success" @click="submitForm" :loading="submitting">提交申报</el-button>
      <el-button @click="saveDraft">保存草稿</el-button>
    </el-form-item>
  </el-form>
</el-card>
</div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const formRef = ref(null)
const activeStep = ref(0)
const submitting = ref(false)

const categories = [
  { label: '思想品德', value: 'morality' },
  { label: '学业发展', value: 'academic' },
  { label: '身心健康', value: 'physical' },
  { label: '艺术素养', value: 'art' },
  { label: '社会实践', value: 'social' }
]

const form = reactive({
  morality: [{ description: '', materialUrl: '', uploadProgress: 0 }],
  academic: [{ description: '', materialUrl: '', uploadProgress: 0 }],
  physical: [{ description: '', materialUrl: '', uploadProgress: 0 }],
  art: [{ description: '', materialUrl: '', uploadProgress: 0 }],
  social: [{ description: '', materialUrl: '', uploadProgress: 0 }]
})

const rules = {
  // Add validation rules here
}

// 模拟上传URL，实际使用时替换为真实的上传接口
const uploadUrl = 'http://example.com/upload'

// 实际的上传接口可能如下：
// const uploadUrl = `${baseURL}/report/upload?t=${localStorage.getItem('token')}&ID=${localStorage.getItem('ID')}`

const addItem = () => {
  form[categories[activeStep.value].value].push({ description: '', materialUrl: '', uploadProgress: 0 })
}

const removeItem = () => {
  if (form[categories[activeStep.value].value].length > 1) {
    form[categories[activeStep.value].value].pop()
  }
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
    //       description: item.description
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

.form-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.el-steps {
  margin-bottom: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .report-form {
    padding: 10px;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }

  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }
}
</style>
