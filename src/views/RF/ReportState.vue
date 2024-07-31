<template>
  <div class="report-state">
    <h1>申报进度查询</h1>
    <el-row :gutter="20" justify="center">
      <el-col :xs="24" :sm="24" :md="12" align="middle">
        <el-card class="progress-card" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>当前进度</span>
              <el-button class="refresh-btn" type="primary" icon="Refresh" @click="refreshStatus">刷新</el-button>
            </div>
          </template>
          <div class="progress-container large-container">
            <el-progress type="circle" :percentage="Math.floor(currentProgress)" :status="progressStatus">
              <template #default="{ percentage }">
                <span class="progress-value">{{ Math.floor(percentage) }}%</span>
                <span class="progress-label">{{ currentStatus }}</span>
              </template>
            </el-progress>
          </div>
          <div class="progress-steps">
            <el-steps :active="currentStep" finish-status="success" align-center>
              <el-step title="提交申报" description="已提交待审核"></el-step>
              <el-step title="班委初审" description="班委审核中"></el-step>
              <el-step title="交叉复审" description="其他班级班委审核"></el-step>
              <el-step title="最终确认" description="确认最终结果"></el-step>
            </el-steps>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="result-card" v-if="currentStep === 3" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>审核结果</span>
            </div>
          </template>
          <el-descriptions title="综合评价结果" :column="1" border>
            <el-descriptions-item v-for="(value, key) in result" :key="key" :label="getCategoryLabel(key)">
              {{ value }}
            </el-descriptions-item>
            <el-descriptions-item label="总分">{{ calculateTotalScore() }}</el-descriptions-item>
          </el-descriptions>
          <div class="action-buttons">
            <el-button type="primary" @click="confirmResult">确认结果</el-button>
            <el-button type="warning" @click="raiseObjection">提出异议</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="objectionDialogVisible" title="提出异议" width="50%">
      <el-form :model="objectionForm" label-width="120px">
        <el-form-item label="异议类别">
          <el-select v-model="objectionForm.category" placeholder="请选择异议类别">
            <el-option v-for="category in categories" :key="category.value" :label="category.label" :value="category.value"></el-option>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const currentStep = ref(0)
const loading = ref(false)
const objectionDialogVisible = ref(false)

const result = ref({
  morality: 0,
  academic: 0,
  physical: 0,
  art: 0,
  social: 0
})

const objectionForm = ref({
  category: '',
  content: ''
})

const categories = [
  { label: '思想品德', value: 'morality' },
  { label: '学业发展', value: 'academic' },
  { label: '身心健康', value: 'physical' },
  { label: '艺术素养', value: 'art' },
  { label: '社会实践', value: 'social' }
]

const currentProgress = computed(() => {
  return (currentStep.value / 3) * 100
})

const progressStatus = computed(() => {
  if (currentStep.value === 3) return 'success'
  if (currentStep.value > 0) return 'exception'
  return 'warning'
})

const currentStatus = computed(() => {
  const statusMap = ['待审核', '班委初审中', '交叉复审中', '待确认']
  return statusMap[currentStep.value]
})

onMounted(() => {
  fetchReportStatus()
})

const fetchReportStatus = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentStep.value = Math.floor(Math.random() * 4)
    if (currentStep.value === 3) {
      fetchReportResult()
    }

    // 实际的API调用可能如下：
    // const response = await axios.get('/report/getStepID', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     targetID: 'latest' // 或者是特定的报告ID
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   currentStep.value = parseInt(response.data.data.stepID)
    //   if (currentStep.value === 3) {
    //     fetchReportResult()
    //   }
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (error) {
    console.error('获取申报状态失败:', error)
    ElMessage.error('获取申报状态失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const fetchReportResult = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    result.value = {
      morality: Math.floor(Math.random() * 100),
      academic: Math.floor(Math.random() * 100),
      physical: Math.floor(Math.random() * 100),
      art: Math.floor(Math.random() * 100),
      social: Math.floor(Math.random() * 100)
    }

    // 实际的API调用可能如下：
    // const response = await axios.get('/report/seekCE', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     targetID: 'latest' // 或者是特定的报告ID
    //   }
    // })
    // if (response.data) {
    //   result.value = {
    //     morality: response.data.morality || 0,
    //     academic: response.data.academic || 0,
    //     physical: response.data.physical || 0,
    //     art: response.data.art || 0,
    //     social: response.data.social || 0
    //   }
    // } else {
    //   throw new Error('Failed to fetch report result')
    // }
  } catch (error) {
    console.error('获取评价结果失败:', error)
    ElMessage.error('获取评价结果失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const refreshStatus = () => {
  fetchReportStatus()
}

const confirmResult = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('已确认评价结果')

    // 实际的API调用可能如下：
    // const response = await axios.post('/report/audit', null, {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     stepID: '6', // 或 '8'，取决于具体的业务逻辑
    //     targetID: 'latest' // 或者是特定的报告ID
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   ElMessage.success('已确认评价结果')
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (error) {
    console.error('确认失败:', error)
    ElMessage.error('确认失败，请稍后重试')
  }
}

const raiseObjection = () => {
  objectionDialogVisible.value = true
}

const submitObjection = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('异议已提交，等待处理')
    objectionDialogVisible.value = false
    objectionForm.value = {
      category: '',
      content: ''
    }

    // 实际的API调用可能如下：
    // const response = await axios.post('/report/audit', {
    //   category: objectionForm.value.category,
    //   content: objectionForm.value.content
    // }, {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     stepID: '5',
    //     targetID: 'latest' // 或者是特定的报告ID
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   ElMessage.success('异议已提交，等待处理')
    //   objectionDialogVisible.value = false
    //   objectionForm.value = {
    //     category: '',
    //     content: ''
    //   }
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (error) {
    console.error('提交异议失败:', error)
    ElMessage.error('提交异议失败，请稍后重试')
  }
}

const getCategoryLabel = (key: string) => {
  const category = categories.find(c => c.value === key)
  return category ? category.label : key
}

const calculateTotalScore = () => {
  return Object.values(result.value).reduce((a, b) => a + b, 0)
}
</script>

<style scoped>
.report-state {
  padding: 20px;
}

.progress-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  margin: 20px 0;
}

.large-container {
  transform: scale(1);
}

.progress-value {
  font-size: 36px;
  font-weight: bold;
}

.progress-label {
  display: block;
  font-size: 18px;
  margin-top: 5px;
}

.progress-steps {
  margin-top: 30px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

@media (max-width: 768px) {
  .report-state {
    padding: 10px;
  }
  
  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }

  .el-card {
    margin-bottom: 15px;
  }

  .el-steps {
    padding: 0;
  }

  .el-step__title {
    font-size: 12px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>