<template>
  <div class="report-form">
    <h1>综合评价信息申报</h1>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
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
                >
                  <el-button size="small" type="primary">上传材料</el-button>
                </el-upload>
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
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交申报</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const formRef = ref(null)
const activeTab = ref('morality')

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
  // 可以根据需要添加验证规则
}

const uploadUrl = 'http://example.com/upload' // 替换为实际的上传URL

const addItem = (category) => {
  form[category].push({
    description: '',
    score: 0,
    materialUrl: ''
  })
}

const removeItem = (category, index) => {
  form[category].splice(index, 1)
}

const handleUploadSuccess = (res, item) => {
  item.materialUrl = res.url // 假设服务器返回的数据中包含 url 字段
  ElMessage.success('上传成功')
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const beforeUpload = (file) => {
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('上传文件大小不能超过 2MB!')
  }
  return isLt2M
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // const response = await axios.post('/api/submit-report', form)
        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('申报提交成功')
        // 清空表单或进行其他操作
      } catch (error) {
        ElMessage.error('提交失败，请重试')
      }
    } else {
      ElMessage.error('请填写完整信息')
    }
  })
}

const saveDraft = () => {
  localStorage.setItem('reportDraft', JSON.stringify(form))
  ElMessage.success('草稿已保存')
}

// 在组件挂载时，可以尝试加载之前保存的草稿
onMounted(() => {
  const draft = localStorage.getItem('reportDraft')
  if (draft) {
    Object.assign(form, JSON.parse(draft))
  }
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
</style>