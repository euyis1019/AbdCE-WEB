<template>
  <div class="admin-todo">
    <h1>待办事项</h1>
    <el-table :data="todoItems" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="180"></el-table-column>
      <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
      <el-table-column prop="className" label="班级" width="120"></el-table-column>
      <el-table-column prop="category" label="类别" width="120"></el-table-column>
      <el-table-column prop="submitTime" label="提交时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button type="primary" size="small" @click="startReview(scope.row)">审核</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalItems"
    >
    </el-pagination>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

const todoItems = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const loading = ref(false)

onMounted(async () => {
  await fetchTodoItems()
})

const fetchTodoItems = async () => {
  loading.value = true
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    todoItems.value = Array(20).fill(null).map((_, index) => ({
      id: `item-${index + 1}`,
      studentName: `学生${index + 1}`,
      className: `软件工程${index % 2 + 1}班`,
      category: ['思想品德', '学业发展', '身心健康', '艺术素养', '社会实践'][index % 5],
      submitTime: Date.now() - Math.random() * 86400000,
    }))
    totalItems.value = 100

    // 实际的 API 调用可能如下：
    // const response = await axios.get('/api/todo-items', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     page: currentPage.value,
    //     pageSize: pageSize.value
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   todoItems.value = response.data.items
    //   totalItems.value = response.data.total
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

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchTodoItems()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchTodoItems()
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const startReview = (item: any) => {
  router.push({
    name: 'ImmersiveReview',
    params: { taskId: item.id },
    query: { returnTo: 'todo' }
  })
}
</script>

<style scoped>
.admin-todo {
  padding: 20px;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}
</style>