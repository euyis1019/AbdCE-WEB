<template>
  <div class="review-management">
    <h1>复审管理</h1>
    <el-table :data="paginatedReviewItems" style="width: 100%" v-loading="loading">
      <el-table-column prop="FileID" label="文件ID" width="280"></el-table-column>
      <el-table-column label="类别" width="180">
        <template #default="scope">
          <CategoryInfo :categoryCode="scope.row.categorycode" />
        </template>
      </el-table-column>
      <el-table-column prop="applicationTime" label="提交时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.applicationTime) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row)">{{ getStatusLabel(scope.row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="point" label="分数" width="80">
        <template #default="scope">
          {{ scope.row.point !== null ? scope.row.point : '未评分' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from '../http-common'
import authService from '../services/authService'
import CategoryInfo from '../components/CategoryInfo.vue'

const router = useRouter()

// 状态变量
const reviewItems = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const loading = ref(false)

// 计算属性：获取当前页的复审项目
const paginatedReviewItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return reviewItems.value.slice(start, end)
})

// 生命周期钩子：组件挂载时获取复审项目
onMounted(async () => {
  await fetchReviewItems()
})

// 获取复审项目列表
const fetchReviewItems = async () => {
  loading.value = true
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.get('/admin/getCE', {
      params: { userID: user.StudentId }
    })

    if (response.data.statusID === 0) {
      // 只获取待复审的案件
      reviewItems.value = response.data.data.finalTodoList?.files || []
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

// 格式化日期
const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取状态类型（用于 el-tag 的类型）
const getStatusType = (row: any) => {
  // 在复审管理页面，所有项目都是待复审状态
  return 'warning'
}

// 获取状态标签文本
const getStatusLabel = (row: any) => {
  // 在复审管理页面，所有项目都是待复审状态
  return '待复审'
}

// 处理页面大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 开始复审
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

@media (max-width: 768px) {
  .review-management {
    padding: 10px;
  }

  .el-table {
    font-size: 12px;
  }

  .el-button {
    padding: 5px 10px;
    font-size: 12px;
  }

  .el-pagination {
    text-align: center;
  }
}
</style>