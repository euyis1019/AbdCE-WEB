<template>
  <div class="review-management">
    <h1>复审管理</h1>
    <el-table :data="reviewItems" style="width: 100%" v-loading="loading">
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
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="startReReview(scope.row)">复审</el-button>
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
import axios from '../http-common'
import authService from '../services/authService'
import CategoryInfo from '../components/CategoryInfo.vue'

const router = useRouter()

const reviewItems = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const loading = ref(false)

onMounted(async () => {
  await fetchReviewItems()
})

// 获取复审列表
const fetchReviewItems = async () => {
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
      // 获取 finalTodoList 中的文件列表
      reviewItems.value = response.data.data.finalTodoList.files
      totalItems.value = reviewItems.value.length
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取复审项目失败:', error)
    ElMessage.error('获取复审项目失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchReviewItems()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchReviewItems()
}

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusType = (row: any) => {
  return 'warning' // 所有待复审的项目都使用 warning 类型
}

const getStatusLabel = (row: any) => {
  return '待复审' // 所有项目的状态都是 '待复审'
}

const startReReview = (item: any) => {
  router.push({
    name: 'ImmersiveReview',
    params: { taskId: item.FileID },
    query: { mode: 'rereview', returnTo: 'review-management' }
  })
}
</script>

<style scoped>
.review-management {
  padding: 20px;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}
</style>