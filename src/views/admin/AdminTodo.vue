<!-- Start of Selection -->
<template>
    <div class="admin-todo">
      <h1>待办事项</h1>
      <el-table :data="todoItems" v-loading="loading" style="width: 100%">
        <el-table-column prop="uuid" label="ID" width="220"></el-table-column>
        <el-table-column prop="name" label="学生姓名" width="120"></el-table-column>
        <el-table-column prop="class" label="班级" width="120"></el-table-column>
        <el-table-column prop="updateTime" label="提交时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="stepID" label="状态" width="120">
          <template #default="scope">
            {{ getStatusLabel(scope.row.stepID) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleAudit(scope.row)">审核</el-button>
            <el-button size="small" type="primary" @click="enterImmersiveMode(scope.row)">沉浸模式</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  
  const router = useRouter()
  const todoItems = ref([])
  const loading = ref(false)
  
  onMounted(() => {
    fetchTodoItems()
  })
  
  const fetchTodoItems = async () => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      todoItems.value = Array(5).fill(null).map((_, index) => ({
        uuid: `todo-${index + 1}`,
        name: `学生${index + 1}`,
        class: `软件工程${index % 2 + 1}班`,
        userID: `2022380000${index + 1}`,
        updateTime: Date.now() - Math.random() * 86400000,
        stepID: Math.floor(Math.random() * 3)
      }))
  
      // 实际的API调用可能如下：
      // const response = await axios.get('/report/getTDList', {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   todoItems.value = response.data.data.toDoList
      // } else {
      //   throw new Error(response.data.msg)
      // }
    } catch (error) {
      console.error('获取待办事项失败:', error)
      ElMessage.error('获取待办事项失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }
  
  const getStatusLabel = (stepID) => {
    const statusMap = {
      0: '待班委初审',
      1: '待交叉复审',
      2: '待本人确认',
    }
    return statusMap[stepID] || '未知状态'
  }
  
  const handleAudit = (item) => {
    // 实现审核逻辑，可能是打开一个对话框或导航到审核页面
    console.log('审核项目:', item)
  }

  const enterImmersiveMode = (item) => {
    router.push({
      name: 'ImmersiveReview',
      query: { taskId: item.uuid }
    })
  }
  </script>
  
  <style scoped>
  .admin-todo {
    padding: 20px;
  }
  
  @media (max-width: 768px) {
    .admin-todo {
      padding: 10px;
    }
  }
  </style>
<!-- End of Selection -->