<template>
    <div class="review-management">
      <h1>复审管理</h1>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>待复审项目</span>
              </div>
            </template>
            <el-table :data="reviewItems" style="width: 100%">
              <el-table-column prop="id" label="ID" width="180"></el-table-column>
              <el-table-column prop="name" label="学生姓名"></el-table-column>
              <el-table-column prop="class" label="班级"></el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'conflict' ? 'danger' : 'warning'">
                    {{ scope.row.status === 'conflict' ? '冲突' : '待复审' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button size="small" type="primary" @click="handleReview(scope.row)">复审</el-button>
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
  
  const reviewItems = ref([])
  
  onMounted(async () => {
    await fetchReviewItems()
  })
  
  const fetchReviewItems = async () => {
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      reviewItems.value = [
        { id: '001', name: '张三', class: '软件工程1班', status: 'conflict' },
        { id: '002', name: '李四', class: '软件工程2班', status: 'pending' },
        { id: '003', name: '王五', class: '软件工程1班', status: 'conflict' },
      ]
  
      // 实际的 API 调用可能如下：
      // const response = await axios.get('/api/review-items', {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   reviewItems.value = response.data.items
      // } else {
      //   throw new Error(response.data.msg)
      // }
    } catch (error) {
      console.error('获取复审项目失败:', error)
      ElMessage.error('获取复审项目失败，请稍后重试')
    }
  }
  
  const handleReview = (item) => {
    // 处理复审逻辑
    console.log('复审项目:', item)
    // 这里可以跳转到详细的复审页面或打开复审对话框
  }
  </script>
  
  <style scoped>
  .review-management {
    padding: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  </style>