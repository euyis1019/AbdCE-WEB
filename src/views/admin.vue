<template>
  <div class="admin-view">
    <h1>审核管理</h1>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待审核项目" name="pending">
        <el-table :data="pendingItems" v-loading="loading.pending" style="width: 100%">
          <!-- 表格列定义保持不变 -->
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
              <el-button size="small" @click="handleAudit(scope.row)">审核</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="已审核项目" name="reviewed">
        <el-table :data="reviewedItems" v-loading="loading.reviewed" style="width: 100%">
          <!-- 表格列定义保持不变 -->
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
      </el-tab-pane>
    </el-tabs>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核项目" width="80%" :before-close="handleCloseAuditDialog">
      <div v-if="currentAuditItem" v-loading="loading.auditDetails">
        <h2>学生信息</h2>
        <p><strong>姓名：</strong>{{ currentAuditItem.name }}</p>
        <p><strong>学号：</strong>{{ currentAuditItem.userID }}</p>
        <p><strong>班级：</strong>{{ currentAuditItem.class }}</p>
        <p><strong>提交时间：</strong>{{ formatDate(currentAuditItem.updateTime) }}</p>

        <h2>申报内容</h2>
        <el-tabs v-model="activeAuditTab">
          <el-tab-pane v-for="category in categories" :key="category.value" :label="category.label" :name="category.value">
            <el-table :data="currentAuditItem[category.value] || []" border style="width: 100%">
              <el-table-column prop="description" label="描述"></el-table-column>
              <el-table-column prop="score" label="分数" width="100"></el-table-column>
              <el-table-column label="材料" width="180">
                <template #default="scope">
                  <el-button v-if="scope.row.materialUrl" size="small" type="primary" @click="viewMaterial(scope.row.materialUrl)">
                    查看材料
                  </el-button>
                  <span v-else>无材料</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <h2>审核意见</h2>
        <el-form :model="auditForm" label-width="120px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="auditForm.result">
              <el-radio label="pass">通过</el-radio>
              <el-radio label="reject">驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input v-model="auditForm.comment" type="textarea" :rows="4"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAudit" :loading="loading.submitAudit">提交审核</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('pending')
const activeAuditTab = ref('morality')
const auditDialogVisible = ref(false)
const currentAuditItem = ref(null)
const pendingItems = ref([])
const reviewedItems = ref([])

const categories = [
  { label: '思想品德', value: 'morality' },
  { label: '学业发展', value: 'academic' },
  { label: '身心健康', value: 'physical' },
  { label: '艺术素养', value: 'art' },
  { label: '社会实践', value: 'social' }
]

const loading = reactive({
  pending: false,
  reviewed: false,
  auditDetails: false,
  submitAudit: false
})

const auditForm = reactive({
  result: '',
  comment: ''
})

onMounted(() => {
  fetchPendingItems()
  fetchReviewedItems()
})

// 获取待审核项目
const fetchPendingItems = async () => {
  loading.pending = true
  try {
    // 使用 /admin/getTDList 接口获取待审核项目
    const response = await axios.post('/admin/getTDList', {
      userID: localStorage.getItem('ID')
    }, {
      params: {
        t: localStorage.getItem('token'),
        ID: localStorage.getItem('ID')
      }
    })

    if (response.data.statusID === 0) {
      pendingItems.value = response.data.data
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取待审核项目失败:', error)
    ElMessage.error('获取待审核项目失败，请稍后重试')
  } finally {
    loading.pending = false
  }
}

// 获取已审核项目
const fetchReviewedItems = async () => {
  loading.reviewed = true
  try {
    // 使用 /admin/history 接口获取审核历史（已审核项目）
    const response = await axios.get('/admin/history', {
      params: {
        t: localStorage.getItem('token'),
        ID: localStorage.getItem('ID')
      }
    })

    if (response.data.statusID === 0) {
      // 可能需要对返回的数据进行转换以匹配表格结构
      reviewedItems.value = transformHistoryData(response.data.data)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取已审核项目失败:', error)
    ElMessage.error('获取已审核项目失败，请稍后重试')
  } finally {
    loading.reviewed = false
  }
}

// 转换审核历史数据以匹配表格结构
const transformHistoryData = (historyData) => {
  return historyData.map(item => ({
    uuid: item.uuid,
    name: item.name,
    class: item.class,
    updateTime: item.updateTime,
    stepID: item.stepID,
    // 添加其他需要的字段
  }))
}

// 处理审核
const handleAudit = async (item) => {
  currentAuditItem.value = item
  auditDialogVisible.value = true
  loading.auditDetails = true
  try {
    // 使用 /admin/getCE 接口获取审核详情
    const response = await axios.post('/admin/getCE', {
      userID: localStorage.getItem('ID')
    }, {
      params: {
        t: localStorage.getItem('token'),
        ID: localStorage.getItem('ID')
      }
    })
    
    if (response.data.statusID === 0) {
      // 找到对应的项目详情
      const itemDetails = response.data.data.find(detail => detail.fileID === item.fileID)
      if (itemDetails) {
        currentAuditItem.value = { ...item, ...itemDetails }
      } else {
        throw new Error('未找到对应的项目详情')
      }
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取审核详情失败:', error)
    ElMessage.error('获取审核详情失败，请稍后重试')
  } finally {
    loading.auditDetails = false
  }
}

// 提交审核
const submitAudit = async () => {
  if (!auditForm.result) {
    ElMessage.warning('请选择审核结果')
    return
  }
  loading.submitAudit = true
  try {
    // 使用 /report/audit 接口提交审核结果
    const response = await axios.post('/report/audit', null, {
      params: {
        t: localStorage.getItem('token'),
        ID: localStorage.getItem('ID'),
        targetID: currentAuditItem.value.fileID,
        stepID: getNextStepID(currentAuditItem.value.stepID, auditForm.result)
      }
    })
    
    if (response.data.statusID === 0) {
      ElMessage.success('审核提交成功')
      auditDialogVisible.value = false
      fetchPendingItems()
      fetchReviewedItems()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('提交审核失败:', error)
    ElMessage.error('提交审核失败，请稍后重试')
  } finally {
    loading.submitAudit = false
  }
}

// 根据当前状态和审核结果计算下一个状态
const getNextStepID = (currentStepID, result) => {
  const stepID = parseInt(currentStepID)
  if (result === 'pass') {
    switch (stepID) {
      case 0: return '1'  // 班委初审成功
      case 1: return '2'  // 交叉复审成功，返回本人确认
      case 2: return '4'  // 本人确认后，进入级委审核
      case 3: return '4'  // 有分歧的情况，级委审核
      case 4: return '6'  // 级委审核完毕，本人确认
      case 5: return '7'  // 超管审核完毕，本人确认
      case 7: return '8'  // 本人最终确认
      default: return String(stepID + 1)
    }
  } else {
    return '-1'  // 审核不通过，打回修改
  }
}

// 其他辅助函数保持不变
const handleCloseAuditDialog = (done) => {
  ElMessageBox.confirm('确认关闭？未保存的更改将丢失')
    .then(() => {
      done()
      auditForm.result = ''
      auditForm.comment = ''
    })
    .catch(() => {})
}

const viewDetails = (item) => {
  handleAudit(item)
}

const viewMaterial = (url) => {
  window.open(url, '_blank')
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusLabel = (stepID) => {
  const statusMap = {
    '-1': '审核不通过',
    '0': '待班委初审',
    '1': '待交叉复审',
    '2': '待本人确认',
    '3': '待级委审核',
    '4': '待本人确认',
    '5': '待超管审核',
    '6': '已完成',
    '7': '待本人确认',
    '8': '已完成'
  }
  return statusMap[stepID] || '未知状态'
}
</script>

<style scoped>
.admin-view {
  padding: 20px;
}

.el-table {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .admin-view {
    padding: 10px;
  }
}
</style>