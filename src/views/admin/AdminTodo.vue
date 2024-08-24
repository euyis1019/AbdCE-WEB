<template>
  <div class="admin-todo">
    <h1>待办事项</h1>
    <el-table :data="todoItems" style="width: 100%" v-loading="loading">
      <el-table-column prop="FileID" label="ID" width="180"></el-table-column>
      <el-table-column prop="userID" label="学生学号" width="120"></el-table-column>
      <el-table-column prop="applicationTime" label="提交时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.applicationTime) }}
        </template>
      </el-table-column>
      <el-table-column label="类别" width="120">
        <template #default="scope">
          <CategoryInfo :categoryCode="scope.row.categorycode" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row)">{{ getStatusLabel(scope.row) }}</el-tag>
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from '../../http-common'
import authService from '../../services/authService'
import CategoryInfo from '../../components/CategoryInfo.vue'

const router = useRouter()

const todoItems = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const loading = ref(false)

const isAdmin = computed(() => {
  const user = authService.getCurrentUser()
  return user && user.Permission === '3'
})

onMounted(async () => {
  await fetchTodoItems()
})

const fetchTodoItems = async () => {
  loading.value = true
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/admin/getCE', {
      userID: user.ID
    })

    if (response.data.statusID === 0) {
      if (isAdmin.value) {
        // 管理员获取待复审的案件
        todoItems.value = response.data.data.finalTodoList.files
      } else {
        // 普通审核员获取待初审的案件
        todoItems.value = response.data.data.reviewTodoList.files
      }
      totalItems.value = todoItems.value.length
    } else {
      throw new Error(response.data.msg)
    }
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

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusType = (row: any) => {
  if (isAdmin.value) {
    return 'warning' // 管理员的待复审项目
  } else {
    return row.isDone ? 'success' : 'warning' // 普通审核员的待初审项目
  }
}

const getStatusLabel = (row: any) => {
  if (isAdmin.value) {
    return '待复审'
  } else {
    return row.isDone ? '已初审' : '待初审'
  }
}

const startReview = (item: any) => {
  router.push({
    name: 'ImmersiveReview',
    params: { taskId: item.FileID },
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

@media (max-width: 768px) {
  .admin-todo {
    padding: 10px;
  }

  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }
}
</style>
