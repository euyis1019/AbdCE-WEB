<template>
  <div class="review-management">
    <h1>复审管理</h1>
    <el-table :data="reviewItems" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="180"></el-table-column>
      <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
      <el-table-column prop="className" label="班级" width="120"></el-table-column>
      <el-table-column prop="category" label="类别" width="120"></el-table-column>
      <el-table-column prop="submitTime" label="提交时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="startReReview(scope.row)">复审</el-button>
          <el-button type="warning" size="small" v-if="scope.row.status === 'conflicted'" @click="resolveConflict(scope.row)">解决冲突</el-button>
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

const router = useRouter()

const reviewItems = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const loading = ref(false)

onMounted(async () => {
  await fetchReviewItems()
})

const fetchReviewItems = async () => {
  loading.value = true
  try {
    // 使用 authService 获取当前用户信息
    const user = authService.getCurrentUser() 
    // 如果用户未登录
    if (!user) { 
      // 抛出错误
      throw new Error('用户未登录'); 
    }

    // 获取复审列表
    const response = await axios.get('/admin/getReviewList', { 
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    });
    // 如果请求成功
    if (response.data.statusID === 0) { 
      // 设置复审项目列表
      reviewItems.value = response.data.items; 
      // 设置总项目数
      totalItems.value = response.data.total; 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理获取复审项目失败的错误
    console.error('获取复审项目失败:', error); 
    ElMessage.error('获取复审项目失败，请稍后重试');
  } finally {
    loading.value = false;
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

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  return status === 'conflicted' ? 'danger' : 'success'
}

const getStatusLabel = (status: string) => {
  return status === 'conflicted' ? '有冲突' : '已审核'
}

const startReReview = (item: any) => {
  router.push({
    name: 'ImmersiveReview',
    params: { taskId: item.id },
    query: { mode: 'rereview', returnTo: 'review-management' }
  })
}

const resolveConflict = (item: any) => {
  router.push({
    name: 'ImmersiveReview',
    params: { taskId: item.id },
    query: { mode: 'conflict', returnTo: 'review-management' }
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