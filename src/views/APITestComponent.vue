<template>
  <div class="api-test">
    <h2>API 测试</h2>
    <el-button 
      v-for="test in tests" 
      :key="test.name" 
      @click="runTest(test.name)" 
      :loading="test.loading"
    >
      测试 {{ test.name }}
    </el-button>
    <div v-if="result">
      <h3>测试结果：</h3>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import axios from 'axios'

const result = ref('')

const tests = reactive([
  { name: '登录', loading: false },
  { name: '注册', loading: false },
  { name: '更新申请', loading: false },
  { name: '删除申请', loading: false },
  { name: '创建模板案例', loading: false },
  { name: '更新案例', loading: false },
  { name: '删除示范案例', loading: false },
  { name: '审核', loading: false },
  { name: '分配任务', loading: false },
])

const runTest = async (testName: string) => {
  const test = tests.find(t => t.name === testName)
  if (!test) {
    console.error(`Test "${testName}" not found`)
    return
  }

  test.loading = true
  result.value = ''
  try {
    let response
    switch (testName) {
      case '登录':
        response = await axios.post('/login', { ID: 'testuser', pass: 'testpass' })
        break
      case '注册':
        response = await axios.post('/register', { ID: 'newuser', n: 'New User', tel: '1234567890', pass: 'newpass' })
        break
      case '更新申请':
        response = await axios.post('/record/updatenewrecord', { FileID: 'test123', userID: 'testuser', caseID: 'case123' })
        break
      case '删除申请':
        response = await axios.post('/record/deleterecord', { FileID: 'test123', userID: 'testuser' })
        break
      case '创建模板案例':
        response = await axios.post('/case/newcase', { caseID: 'newcase123', mainCLs: 'main', cls1: 'cls1', cls2: 'cls2', cls3: 'cls3', cls4: 'cls4', point: 10, judgment: 'Good' })
        break
      case '更新案例':
        response = await axios.post('/case/updatenewcase', { caseID: 'case123', mainCLs: 'updatedMain', cls1: 'updatedCls1', cls2: 'updatedCls2', cls3: 'updatedCls3', cls4: 'updatedCls4', point: 15, judgment: 'Very Good' })
        break
      case '删除示范案例':
        response = await axios.post('/case/deleatecase', { caseID: 'case123' })
        break
      case '审核':
        response = await axios.post('/report/audit', { result: 'pass', comment: 'Good job', targetID: 'file123', stepID: '1', ID: 'reviewer1' })
        break
      case '分配任务':
        response = await axios.post('/admin/assignTask', { adminID: 'admin1', reviewerID: 'reviewer1', categoryCodes: ['category1'] })
        break
      default:
        throw new Error(`Unknown test: ${testName}`)
    }
    result.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    console.error(`Error in ${testName} test:`, error)
    result.value = `错误: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`
  } finally {
    test.loading = false
  }
}
</script>

<style scoped>
.api-test {
  padding: 20px;
}
pre {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>