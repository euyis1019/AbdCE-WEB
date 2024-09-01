<template>
    <div class="backend-management">
      <h1>后台管理</h1>
      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="学号">
            <el-input v-model="filterForm.studentId" placeholder="请输入学号"></el-input>
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="filterForm.name" placeholder="请输入姓名"></el-input>
          </el-form-item>
          <el-form-item label="申报状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待审核" value="pending"></el-option>
              <el-option label="已通过" value="approved"></el-option>
              <el-option label="已拒绝" value="rejected"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
          </el-form-item>
        </el-form>
      </el-card>
  
      <el-card v-for="user in users" :key="user.id" class="user-card">
        <template #header>
          <div class="card-header">
            <span>{{ user.name }} ({{ user.studentId }})</span>
            <el-button-group>
              <el-button type="primary" size="small" @click="handleBulkApprove(user.id)">一键通过</el-button>
              <el-button type="danger" size="small" @click="handleBulkReject(user.id)">一键打回</el-button>
            </el-button-group>
          </div>
        </template>
        <div class="timeline-container">
          <div class="timeline-header">
            <div class="timeline-label">申报总进度</div>
            <el-progress :percentage="user.overallProgress" :format="formatProgress"></el-progress>
          </div>
          <div v-for="report in user.reports" :key="report.id" class="timeline-item">
            <div class="timeline-label">{{ report.title }}</div>
            <div class="timeline-progress">
              <div v-for="(stage, index) in report.stages" :key="index" 
                   :class="['progress-point', { 'completed': stage.completed, 'current': stage.current, 'error': stage.error }]"
                   @click="handleStageClick(user.id, report.id, index)"
                   @mouseover="handleStageHover(user.id, report.id, index)"
                   @mouseleave="handleStageLeave">
              </div>
            </div>
          </div>
        </div>
      </el-card>
  
      <el-dialog v-model="dialogVisible" :title="dialogTitle">
        <div v-if="selectedStage">
          <p><strong>申报项目：</strong>{{ selectedStage.reportTitle }}</p>
          <p><strong>阶段：</strong>{{ selectedStage.stageName }}</p>
          <p><strong>状态：</strong>{{ selectedStage.status }}</p>
          <p><strong>审核意见：</strong>{{ selectedStage.comment }}</p>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
            <el-button type="primary" @click="handleEdit">编辑</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const filterForm = ref({
    studentId: '',
    name: '',
    status: ''
  })
  
  const users = ref([])
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const selectedStage = ref(null)
  
  // 模拟数据加载
  onMounted(() => {
    loadUsers()
  })
  
  // 加载用户数据
  const loadUsers = async () => {
    // TODO: 调用后端 API 获取用户数据
    // const response = await axios.get('/admin/getAllUserReports', { params: filterForm.value })
    // users.value = response.data
  
    // 模拟数据
    users.value = [
      {
        id: 1,
        name: '张三',
        studentId: '20230001',
        overallProgress: 75,
        reports: [
          {
            id: 1,
            title: '志愿服务',
            stages: [
              { completed: true },
              { completed: true },
              { completed: true },
              { current: true },
              { completed: false },
            ]
          },
          {
            id: 2,
            title: '学科竞赛',
            stages: [
              { completed: true },
              { completed: true },
              { error: true },
              { completed: false },
              { completed: false },
            ]
          }
        ]
      },
      // 可以添加更多模拟用户数据...
    ]
  }
  
  const handleFilter = () => {
    loadUsers()
  }
  
  const formatProgress = (percentage) => {
    return percentage === 100 ? '完成' : `${percentage}%`
  }
  
  const handleStageClick = (userId, reportId, stageIndex) => {
    // TODO: 获取选中阶段的详细信息
    // const response = await axios.get(`/admin/getStageDetails/${userId}/${reportId}/${stageIndex}`)
    // selectedStage.value = response.data
    
    // 模拟数据
    selectedStage.value = {
      reportTitle: '志愿服务',
      stageName: '初审',
      status: '已通过',
      comment: '表现良好，继续保持'
    }
    
    dialogTitle.value = '阶段详情'
    dialogVisible.value = true
  }
  
  const handleStageHover = (userId, reportId, stageIndex) => {
    // 可以在这里添加悬停效果，例如显示简要信息
  }
  
  const handleStageLeave = () => {
    // 清除悬停效果
  }
  
  const handleEdit = () => {
    // TODO: 实现编辑功能
    ElMessage.success('编辑功能待实现')
  }
  
  const handleBulkApprove = (userId) => {
    // TODO: 调用后端 API 执行批量通过
    // await axios.post('/admin/bulkApprove', { userId })
    ElMessage.success('批量通过成功')
    loadUsers()
  }
  
  const handleBulkReject = (userId) => {
    // TODO: 调用后端 API 执行批量打回
    // await axios.post('/admin/bulkReject', { userId })
    ElMessage.success('批量打回成功')
    loadUsers()
  }
  </script>
  
  <style scoped>
  .backend-management {
    padding: 20px;
  }
  
  .filter-card {
    margin-bottom: 20px;
  }
  
  .user-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .timeline-container {
    margin-top: 20px;
  }
  
  .timeline-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .timeline-label {
    width: 120px;
    font-weight: bold;
  }
  
  .timeline-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .timeline-progress {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-point {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #dcdfe6;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .progress-point.completed {
    background-color: #67c23a;
  }
  
  .progress-point.current {
    background-color: #409eff;
  }
  
  .progress-point.error {
    background-color: #f56c6c;
  }
  
  .progress-point:hover {
    transform: scale(1.2);
  }
  </style>