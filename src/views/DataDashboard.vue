<template>
    <div class="data-dashboard">
      <h1>数据看板</h1>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>审核进度概览</span>
              </div>
            </template>
            <el-table :data="reviewProgress" style="width: 100%">
              <el-table-column prop="name" label="姓名"></el-table-column>
              <el-table-column prop="class" label="班级"></el-table-column>
              <el-table-column prop="progress" label="进度">
                <template #default="scope">
                  <el-progress :percentage="scope.row.progress"></el-progress>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const reviewProgress = ref([])
  
  onMounted(async () => {
    await fetchReviewProgress()
  })
  
  const fetchReviewProgress = async () => {
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      reviewProgress.value = [
        { name: '张三', class: '软件工程1班', progress: 75 },
        { name: '李四', class: '软件工程2班', progress: 50 },
        { name: '王五', class: '软件工程1班', progress: 100 },
      ]
  
      // 实际的 API 调用可能如下：
      // const response = await axios.get('/api/review-progress', {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   reviewProgress.value = response.data.progress
      // } else {
      //   throw new Error(response.data.msg)
      // }
    } catch (error) {
      console.error('获取审核进度失败:', error)
      ElMessage.error('获取审核进度失败，请稍后重试')
    }
  }
  </script>
  
  <style scoped>
  .data-dashboard {
    padding: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  </style>