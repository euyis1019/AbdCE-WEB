<template>
    <div class="immersive-review">
      <div class="top-bar">
        <el-button @click="exitImmersiveMode" icon="el-icon-back">返回</el-button>
        <span>{{ currentTask.categoryName }} - {{ currentTask.studentName }}</span>
        <span>审核员：{{ reviewerName }}</span>
      </div>
      <div class="main-content">
        <div class="rules-section">
          <h3>审核规则</h3>
          <p>{{ currentTask.rules }}</p>
        </div>
        <div class="material-preview">
          <h3>申请材料</h3>
          <!-- 这里应该根据材料类型（图片、PDF等）来选择合适的预览组件 -->
          <img v-if="currentTask.materialType === 'image'" :src="currentTask.materialUrl" alt="申请材料">
          <!-- 对于PDF等其他类型的文件，可以使用相应的预览组件 -->
        </div>
        <div class="result-input">
          <h3>审核结果</h3>
          <el-form :model="reviewResult" label-width="100px">
            <el-form-item label="审核结果">
              <el-radio-group v-model="reviewResult.status">
                <el-radio label="pass">通过</el-radio>
                <el-radio label="reject">驳回</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="评分">
              <el-input-number v-model="reviewResult.score" :min="0" :max="100"></el-input-number>
            </el-form-item>
            <el-form-item label="审核意见">
              <el-input type="textarea" v-model="reviewResult.comment" rows="4"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitReview">提交审核结果</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  
  const router = useRouter()
  
  const currentTask = ref({
    id: '',
    categoryName: '',
    studentName: '',
    rules: '',
    materialType: '',
    materialUrl: '',
  })
  
  const reviewerName = ref('')
  
  const reviewResult = ref({
    status: '',
    score: 0,
    comment: '',
  })
  
  const exitImmersiveMode = () => {
    router.push('/admin/todo')
  }
  
  const submitReview = async () => {
    // 这里应该调用API来提交审核结果
    console.log('提交审核结果:', reviewResult.value)
    
    ElMessage.success('审核结果已提交')
    
    // 模拟获取下一个任务
    await getNextTask()
  }
  

const getNextTask = async () => {
  // 这里应该调用API来获取下一个待审核任务
  // 暂时使用模拟数据
  currentTask.value = {
    id: Math.random().toString(36).substr(2, 9),
    categoryName: '学习成绩',
    studentName: '张三',
    rules: '根据学生提供的成绩单和获奖证书进行评分。',
    materialType: 'image',
    materialUrl: 'https://example.com/sample-transcript.jpg',
  }
  
  // 重置审核结果
  reviewResult.value = {
    status: '',
    score: 0,
    comment: '',
  }
}

onMounted(async () => {
  reviewerName.value = localStorage.getItem('userName') || '未知审核员'
  await getNextTask()
})
</script>

<style scoped>
.immersive-review {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background-color: #f0f2f5;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.rules-section, .material-preview, .result-input {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.rules-section {
  background-color: #f9f9f9;
}

.material-preview img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.result-input {
  background-color: #ffffff;
}
</style>