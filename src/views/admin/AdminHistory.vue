<template>
    <div class="admin-history">
      <h1>审核历史</h1>
      <el-table :data="historyItems" v-loading="loading" style="width: 100%">
        <el-table-column prop="uuid" label="ID" width="220"></el-table-column>
        <el-table-column prop="name" label="学生姓名" width="120"></el-table-column>
        <el-table-column prop="class" label="班级" width="120"></el-table-column>
        <el-table-column prop="updateTime" label="审核时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="stepID" label="状态" width="120">
          <template #default="scope">
            {{ getStatusLabel(scope.row.stepID) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="viewDetails(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const historyItems = ref([])
  const loading = ref(false)
  
  onMounted(() => {
    fetchHistoryItems()
  })
  
  const fetchHistoryItems = async () => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      historyItems.value = Array(10).fill(null).map((_, index) => ({
        uuid: `history-${index + 1}`,
        name: `学生${index + 1}`,
        class: `软件工程${index % 2 + 1}班`,
        userID: `2022380000${index + 1}`,
        updateTime: Date.now() - Math.random() * 86400000 * 30,
        stepID: Math.floor(Math.random() * 8) + 1
      }))
  
      // 实际的API调用可能如下：
      // const response = await axios.get('/admin/history', {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   historyItems.value = response.data.data
      // } else {
      //   throw new Error(response.data.msg)
      // }
    } catch (error) {
      console.error('获取审核历史失败:', error)
      ElMessage.error('获取审核历史失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }
  
  const getStatusLabel = (stepID) => {
    const statusMap = {
      1: '班委初审通过',
      2: '交叉复审通过',
      3: '级委审核通过',
      4: '本人已确认',
      5: '超管审核通过',
      6: '审核完成',
      7: '本人已确认',
      8: '审核完成'
    }
    return statusMap[stepID] || '未知状态'
  }
  
  const viewDetails = (item) => {
    // 实现查看详情的逻辑，可能是打开一个对话框或导航到详情页面
    console.log('查看详情:', item)
  }
  </script>
  
  <style scoped>
  .admin-history {
    padding: 20px;
  }
  
  @media (max-width: 768px) {
    .admin-history {
      padding: 10px;
    }
  }
  </style>