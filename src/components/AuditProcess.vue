<template>
    <div class="audit-process">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>待审核项目</span>
            <el-button class="button" text @click="fetchAuditItems">刷新列表</el-button>
          </div>
        </template>
        <el-table :data="auditItems" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
          <el-table-column prop="category" label="类别" width="120"></el-table-column>
          <el-table-column prop="submitTime" label="提交时间" width="180"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="handleAudit(scope.row)">审核</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <el-dialog v-model="auditDialogVisible" title="审核项目" width="50%">
        <el-form :model="auditForm" label-width="120px">
          <el-form-item label="学生姓名">
            <el-input v-model="auditForm.studentName" disabled></el-input>
          </el-form-item>
          <el-form-item label="类别">
            <el-input v-model="auditForm.category" disabled></el-input>
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="auditForm.content" type="textarea" :rows="4" disabled></el-input>
          </el-form-item>
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
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="auditDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitAudit">提交审核</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const auditItems = ref([])
  const auditDialogVisible = ref(false)
  const auditForm = ref({
    id: '',
    studentName: '',
    category: '',
    content: '',
    result: '',
    comment: ''
  })
  
  onMounted(() => {
    fetchAuditItems()
  })
  
  const fetchAuditItems = async () => {
    try {
      // 实际项目中，这里应该调用后端 API
      // const response = await axios.get('/api/audit-items')
      // 模拟 API 响应
      await new Promise(resolve => setTimeout(resolve, 1000))
      auditItems.value = [
        { id: '1', studentName: '张三', category: '思想品德', submitTime: '2023-05-01 10:00:00', status: '待审核' },
        { id: '2', studentName: '李四', category: '学业发展', submitTime: '2023-05-02 11:30:00', status: '待审核' },
        { id: '3', studentName: '王五', category: '身心健康', submitTime: '2023-05-03 14:15:00', status: '待审核' },
      ]
    } catch (error) {
      ElMessage.error('获取待审核项目失败，请稍后重试')
    }
  }
  
  const getStatusType = (status) => {
    switch (status) {
      case '待审核':
        return 'warning'
      case '已通过':
        return 'success'
      case '已驳回':
        return 'danger'
      default:
        return 'info'
    }
  }
  
  const handleAudit = (row) => {
    auditForm.value = {
      id: row.id,
      studentName: row.studentName,
      category: row.category,
      content: '这里是申报内容...',  // 实际项目中，这里应该从后端获取详细内容
      result: '',
      comment: ''
    }
    auditDialogVisible.value = true
  }
  
  const submitAudit = async () => {
    try {
      // 实际项目中，这里应该调用后端 API
      // await axios.post('/api/submit-audit', auditForm.value)
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      ElMessage.success('审核结果已提交')
      auditDialogVisible.value = false
      fetchAuditItems()  // 刷新列表
    } catch (error) {
      ElMessage.error('提交审核结果失败，请稍后重试')
    }
  }
  </script>
  
  <style scoped>
  .audit-process {
    padding: 20px;
  }
  
  .box-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .el-table {
    margin-top: 20px;
  }
  
  .dialog-footer button:first-child {
    margin-right: 10px;
  }
  </style>