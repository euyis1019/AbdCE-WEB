<template>
  <div class="report-state">
    <h1>申报进度查询</h1>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>当前进度</span>
          <el-button class="button" text @click="refreshStatus">刷新</el-button>
        </div>
      </template>
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="提交申报" description="已提交待审核"></el-step>
        <el-step title="班委初审" description="班委审核中"></el-step>
        <el-step title="交叉复审" description="其他班级班委审核"></el-step>
        <el-step title="最终确认" description="确认最终结果"></el-step>
      </el-steps>
    </el-card>

    <el-card class="box-card" v-if="currentStep === 3">
      <template #header>
        <div class="card-header">
          <span>审核结果</span>
        </div>
      </template>
      <el-descriptions title="综合评价结果" :column="2" border>
        <el-descriptions-item label="思想品德">{{ result.morality }}</el-descriptions-item>
        <el-descriptions-item label="学业发展">{{ result.academic }}</el-descriptions-item>
        <el-descriptions-item label="身心健康">{{ result.physical }}</el-descriptions-item>
        <el-descriptions-item label="艺术素养">{{ result.art }}</el-descriptions-item>
        <el-descriptions-item label="社会实践">{{ result.social }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ result.total }}</el-descriptions-item>
      </el-descriptions>
      <div class="action-buttons" v-if="currentStep === 3">
        <el-button type="primary" @click="confirmResult">确认结果</el-button>
        <el-button type="warning" @click="raiseObjection">提出异议</el-button>
      </div>
    </el-card>

    <el-dialog v-model="objectionDialogVisible" title="提出异议" width="50%">
      <el-form :model="objectionForm" label-width="120px">
        <el-form-item label="异议类别">
          <el-select v-model="objectionForm.category" placeholder="请选择异议类别">
            <el-option label="思想品德" value="morality"></el-option>
            <el-option label="学业发展" value="academic"></el-option>
            <el-option label="身心健康" value="physical"></el-option>
            <el-option label="艺术素养" value="art"></el-option>
            <el-option label="社会实践" value="social"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="异议内容">
          <el-input v-model="objectionForm.content" type="textarea" :rows="4"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="objectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitObjection">提交异议</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const currentStep = ref(0)
const result = ref({
  morality: 0,
  academic: 0,
  physical: 0,
  art: 0,
  social: 0,
  total: 0
})
const objectionDialogVisible = ref(false)
const objectionForm = ref({
  category: '',
  content: ''
})

onMounted(() => {
  fetchReportStatus()
})

const fetchReportStatus = async () => {
  try {
    // 实际项目中，这里应该调用后端 API
    // const response = await axios.get('/api/report-status')
    // 模拟 API 响应
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentStep.value = Math.floor(Math.random() * 4)
    if (currentStep.value === 3) {
      fetchReportResult()
    }
  } catch (error) {
    ElMessage.error('获取申报状态失败，请稍后重试')
  }
}

const fetchReportResult = async () => {
  try {
    // 实际项目中，这里应该调用后端 API
    // const response = await axios.get('/api/report-result')
    // 模拟 API 响应
    await new Promise(resolve => setTimeout(resolve, 1000))
    result.value = {
      morality: Math.floor(Math.random() * 100),
      academic: Math.floor(Math.random() * 100),
      physical: Math.floor(Math.random() * 100),
      art: Math.floor(Math.random() * 100),
      social: Math.floor(Math.random() * 100),
      total: 0
    }
    result.value.total = Object.values(result.value).reduce((a, b) => a + b, 0)
  } catch (error) {
    ElMessage.error('获取评价结果失败，请稍后重试')
  }
}

const refreshStatus = () => {
  fetchReportStatus()
}

const confirmResult = async () => {
  try {
    // 实际项目中，这里应该调用后端 API
    // await axios.post('/api/confirm-result')
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('已确认评价结果')
  } catch (error) {
    ElMessage.error('确认失败，请稍后重试')
  }
}

const raiseObjection = () => {
  objectionDialogVisible.value = true
}

const submitObjection = async () => {
  try {
    // 实际项目中，这里应该调用后端 API
    // await axios.post('/api/submit-objection', objectionForm.value)
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('异议已提交，等待处理')
    objectionDialogVisible.value = false
    objectionForm.value = {
      category: '',
      content: ''
    }
  } catch (error) {
    ElMessage.error('提交异议失败，请稍后重试')
  }
}
</script>

<style scoped>
.report-state {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>