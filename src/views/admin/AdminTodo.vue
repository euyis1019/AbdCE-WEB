<template>
    <div class="admin-todo">
      <h1>审核管理</h1>
      <el-row :gutter="20" class="centered-content">
        <el-col :xs="24" :sm="12" class="centered-col">
          <el-button class="custom-button" type="primary" @click="startImmersiveReview" icon="el-icon-video-play">
            开始审核
          </el-button>
        </el-col>
        <el-col :xs="24" :sm="12" class="centered-col">
          <el-button class="custom-button" type="info" @click="showReviewQueue" icon="el-icon-view">
            查看审核队列
          </el-button>
        </el-col>
      </el-row>
      <el-dialog v-model="queueDialogVisible" title="审核队列" width="80%">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="未审核" value="pending"></el-option>
              <el-option label="已审核" value="reviewed"></el-option>
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
      
        <el-table :data="filteredQueueItems" v-loading="loading" style="width: 100%">
          <el-table-column prop="uuid" label="ID" width="220"></el-table-column>
          <el-table-column prop="name" label="学生姓名" width="120"></el-table-column>
          <el-table-column prop="class" label="班级" width="120"></el-table-column>
          <el-table-column prop="updateTime" label="提交时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'pending' ? 'warning' : 'success'">
                {{ scope.row.status === 'pending' ? '未审核' : '已审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button 
                size="small" 
                @click="startSingleReview(scope.row)"
                :disabled="scope.row.status !== 'pending'"
              >
                审核
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const queueItems = ref([])
const loading = ref(false)
const queueDialogVisible = ref(false)

const filterForm = reactive({
  status: '',
  class: ''
})

onMounted(() => {
  fetchQueueItems()
})

const fetchQueueItems = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    queueItems.value = Array(10).fill(null).map((_, index) => ({
      uuid: `item-${index + 1}`,
      name: `学生${index + 1}`,
      class: `软件工程${index % 2 + 1}班`,
      userID: `2022380000${index + 1}`,
      updateTime: Date.now() - Math.random() * 86400000,
      status: index % 3 === 0 ? 'reviewed' : 'pending'
    }))

    // 实际的API调用可能如下：
    // const response = await axios.get('/review/queue', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0) {
    //   queueItems.value = response.data.data
    // } else {
    //   throw new Error(response.data.msg)
    // }
  } catch (error) {
    console.error('获取审核队列失败:', error)
    ElMessage.error('获取审核队列失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const filteredQueueItems = computed(() => {
  return queueItems.value.filter(item => {
    const statusMatch = filterForm.status === '' || item.status === filterForm.status
    const classMatch = filterForm.class === '' || item.class.includes(filterForm.class)
    return statusMatch && classMatch
  })
})

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const startImmersiveReview = () => {
  const pendingItem = queueItems.value.find(item => item.status === 'pending')
  if (pendingItem) {
    router.push({ name: 'ImmersiveReview', params: { taskId: pendingItem.uuid } })
  } else {
    ElMessage.info('当前没有待审核的项目')
  }
}

const showReviewQueue = () => {
  queueDialogVisible.value = true
}

const startSingleReview = (item) => {
  router.push({ 
    name: 'ImmersiveReview', 
    params: { taskId: item.uuid },
    query: { returnTo: 'queue' }
  })
}

const applyFilter = () => {
  // 筛选逻辑已经在 computed 属性中实现
}

const resetFilter = () => {
  filterForm.status = ''
  filterForm.class = ''
}
</script>
<style scoped>
.admin-todo {
  padding: 20px;
  background: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
}

.centered-content {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 50px;
  text-align: center; /* 按钮文字居中 */
}

.centered-col {
  display: flex;
  justify-content: center;
}

.custom-button {
  width: 200px;
  height: 80px;
  font-size: 20px;
  border-radius: 20px;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-dialog {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
}

.filter-form {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .admin-todo {
    padding: 10px;
  }

  .custom-button {
    width: 80%;
    height: 70px;
    margin-bottom: 20px;
  }

  .el-form--inline .el-form-item {
    display: block;
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>