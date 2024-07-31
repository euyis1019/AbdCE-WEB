<template>
  <div class="admin-todo">
    <h1>审核管理</h1>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="todo-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-button type="primary" @click="startImmersiveReview">开始审核</el-button>
            </div>
          </template>
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
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="startImmersiveReview(scope.row)">审核</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="filter-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>筛选条件</span>
            </div>
          </template>
          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="选择状态">
                <el-option label="全部" value=""></el-option>
                <el-option label="待班委初审" value="0"></el-option>
                <el-option label="待交叉复审" value="1"></el-option>
                <el-option label="待本人确认" value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="班级">
              <el-input v-model="filterForm.class" placeholder="输入班级"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="applyFilter">筛选</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const todoItems = ref([])
const loading = ref(false)

const filterForm = reactive({
  status: '',
  class: ''
})

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

const startImmersiveReview = (item = null) => {
  if (item) {
    router.push({ name: 'ImmersiveReview', params: { taskId: item.uuid } })
  } else if (todoItems.value.length > 0) {
    router.push({ name: 'ImmersiveReview', params: { taskId: todoItems.value[0].uuid } })
  } else {
    ElMessage.info('当前没有待审核的项目')
  }
}

const applyFilter = () => {
  // 实现筛选逻辑
  fetchTodoItems()
}

const resetFilter = () => {
  filterForm.status = ''
  filterForm.class = ''
  fetchTodoItems()
}
</script>
<style scoped>
.admin-todo {
  padding: 20px;
}

.todo-card,
.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .admin-todo {
    padding: 10px;
  }

  .el-form--inline .el-form-item {
    display: block;
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>