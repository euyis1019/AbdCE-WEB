<template>
  <div class="immersive-review">
    <div class="top-bar">
      <el-button @click="exitImmersiveMode" icon="ArrowLeft">退出审核</el-button>
      <span>{{ currentTask.categoryName }} - {{ currentTask.studentName }}</span>
      <span>审核员：{{ reviewerName }}</span>
    </div>
    <div class="main-content">
      <div class="left-panel">
        <div class="rules-section">
          <h3>审核规则</h3>
          <p>{{ currentTask.rules }}</p>
        </div>
        <div class="material-preview">
          <h3>申请材料</h3>
          <el-image v-if="currentTask.materialType === 'image'" :src="currentTask.materialUrl" fit="contain" />
          <el-button v-else-if="currentTask.materialType === 'pdf'" @click="openPdfPreview">查看 PDF</el-button>
          <!-- 可以根据需要添加其他类型的文件预览 -->
        </div>
      </div>
      <div class="right-panel">
        <h3>审核表单</h3>
        <el-form :model="reviewForm" label-width="100px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="reviewForm.result">
              <el-radio label="pass">通过</el-radio>
              <el-radio label="reject">驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="评分">
            <el-input-number v-model="reviewForm.score" :min="0" :max="100"></el-input-number>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input type="textarea" v-model="reviewForm.comment" rows="4"></el-input>
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
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const currentTask = ref({
  id: '',
  categoryName: '',
  studentName: '',
  rules: '',
  materialType: '',
  materialUrl: '',
})

const reviewerName = ref('')

const reviewForm = ref({
  result: '',
  score: 0,
  comment: '',
})

const exitImmersiveMode = () => {
  router.push('/admin/todo')
}

const submitReview = async () => {
  try {
    // 这里应该调用API来提交审核结果
    console.log('提交审核结果:', reviewForm.value)
    
    ElMessage.success('审核结果已提交')
    
    // 获取下一个任务
    await getNextTask()
  } catch (error) {
    ElMessage.error('提交审核结果失败，请重试')
  }
}

const getNextTask = async () => {
  try {
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
    reviewForm.value = {
      result: '',
      score: 0,
      comment: '',
    }
  } catch (error) {
    ElMessage.error('获取下一个任务失败，请重试')
  }
}

const openPdfPreview = () => {
  window.open(currentTask.value.materialUrl, '_blank')
}

onMounted(async () => {
  reviewerName.value = localStorage.getItem('userName') || '未知审核员'
  const taskId = route.params.taskId as string
  if (taskId) {
    // 根据 taskId 获取任务详情
    // 这里应该调用 API 获取任务详情
    // 暂时使用模拟数据
    currentTask.value = {
      id: taskId,
      categoryName: '学习成绩',
      studentName: '张三',
      rules: '根据学生提供的成绩单和获奖证书进行评分。',
      materialType: 'image',
      materialUrl: 'https://example.com/sample-transcript.jpg',
    }
  } else {
    await getNextTask()
  }
})
</script>

<style scoped>
.immersive-review {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background-color: #fff;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel, .right-panel {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.left-panel {
  background-color: #fff;
  margin-right: 10px;
}

.right-panel {
  background-color: #fff;
}

.rules-section, .material-preview {
  margin-bottom: 20px;
}

.el-image {
  max-width: 100%;
  max-height: 400px;
}
</style>