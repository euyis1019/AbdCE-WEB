<template>
  <div class="immersive-review">
    <header class="review-header">
      <el-button @click="exitImmersiveMode" type="text" icon="ArrowLeft">退出审核</el-button>
      <h2>{{ currentTask.categoryName }} - {{ currentTask.studentName }}</h2>
      <span>审核员：{{ reviewerName }}</span>
    </header>

    <main class="review-content">
      <section class="review-left">
        <el-card class="review-card">
          <template #header>
            <h3>审核规则</h3>
          </template>
          <p>{{ currentTask.rules }}</p>
        </el-card>
        
        <el-card class="review-card material-preview">
          <template #header>
            <h3>申请材料</h3>
          </template>
          <el-image v-if="currentTask.materialType === 'image'" :src="currentTask.materialUrl" fit="contain" />
          <iframe v-else-if="currentTask.materialType === 'pdf'" :src="currentTask.materialUrl" width="100%" height="600px"></iframe>
        </el-card>
      </section>
      
      <section class="review-right">
        <div class="review-actions">
          <el-button 
            type="success" 
            size="large" 
            @click="submitReview('pass')" 
            icon="Check"
          >
            通过 (1)
          </el-button>
          <el-button 
            type="danger" 
            size="large" 
            @click="submitReview('reject')" 
            icon="Close"
          >
            拒绝 (2)
          </el-button>
        </div>
        
        <el-form :model="reviewForm" label-position="top">
          <el-form-item label="评分">
            <el-input-number v-model="reviewForm.score" :min="0" :max="100" :step="1" step-strictly controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input type="textarea" v-model="reviewForm.comment" :rows="4" placeholder="请输入审核意见（可选）"></el-input>
          </el-form-item>
        </el-form>

        <div class="bottom-actions">
          <el-button @click="getNextTask" type="primary" icon="ArrowRight">下一个 (Enter)</el-button>
        </div>
      </section>
    </main>

    <el-dialog v-model="confirmDialogVisible" title="确认提交" width="30%" center>
      <span>是否确认提交当前审核结果？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="guideVisible" title="欢迎进入材料审核模式" width="50%" center>
      <div class="guide-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <h4>键盘快捷键：</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="通过申请">1</el-descriptions-item>
              <el-descriptions-item label="拒绝申请">2</el-descriptions-item>
              <el-descriptions-item label="下一个任务">Enter</el-descriptions-item>
              <el-descriptions-item label="退出审核模式">Esc</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <h4>操作说明：</h4>
            <ol>
              <li>查看左侧的审核规则和申请材料</li>
              <li>使用右侧的按钮或键盘快捷键进行审核</li>
              <li>可选择调整评分和添加审核意见</li>
              <li>点击"下一个"或按 Enter 键继续下一项审核</li>
            </ol>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button type="primary" @click="closeGuide">开始审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Close } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const confirmDialogVisible = ref(false)
const guideVisible = ref(true)

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
  if (route.query.returnTo === 'queue') {
    router.push('/admin/todo')
  } else {
    router.push('/admin/todo')
  }
}

const submitReview = (result: 'pass' | 'reject') => {
  reviewForm.value.result = result
  confirmDialogVisible.value = true
}

const confirmSubmit = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 实际的API调用可能如下：
    // const response = await axios.post('/report/audit', {
    //   targetID: currentTask.value.id,
    //   result: reviewForm.value.result,
    //   score: reviewForm.value.score,
    //   comment: reviewForm.value.comment
    // }, {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID'),
    //     stepID: getNextStepID()
    //   }
    // })
    // if (response.data.statusID !== 0) {
    //   throw new Error(response.data.msg)
    // }
    
    ElMessage.success('审核结果已提交')
    confirmDialogVisible.value = false
    
    await getNextTask()
  } catch (error) {
    console.error('提交审核结果失败:', error)
    ElMessage.error('提交审核结果失败，请重试')
  }
}

const getNextTask = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentTask.value = {
      id: Math.random().toString(36).substr(2, 9),
      categoryName: '学习成绩',
      studentName: '张三',
      rules: '根据学生提供的成绩单和获奖证书进行评分。',
      materialType: 'pdf',
      materialUrl: 'https://box.ygxz.xyz/?explorer/share/file&hash=4022sldCx_Y86ueANYd4QeGjK_xGcVVaLhEy5wuwu_8MRROEEK33dF7P0lHTiWtDEpA',
    }
  
    // 实际的API调用可能如下：
    // const response = await axios.get('/report/getTDList', {
    //   params: {
    //     t: localStorage.getItem('token'),
    //     ID: localStorage.getItem('ID')
    //   }
    // })
    // if (response.data.statusID === 0 && response.data.data.toDoList.length > 0) {
    //   const nextTask = response.data.data.toDoList[0]
    //   currentTask.value = {
    //     id: nextTask.uuid,
    //     categoryName: nextTask.categoryName,
    //     studentName: nextTask.name,
    //     rules: '根据学生提供的材料进行评分。',
    //     materialType: 'pdf',
    //     materialUrl: nextTask.materialUrl
    //   }
    // } else {
    //   throw new Error('No more tasks')
    // }

    reviewForm.value = {
      result: '',
      score: 0,
      comment: '',
    }

    if (!currentTask.value.id) {
      ElMessage.info('所有任务已审核完毕')
      exitImmersiveMode()
    }
  } catch (error) {
    console.error('获取下一个任务失败:', error)
    ElMessage.error('获取下一个任务失败，请重试')
  }
}

const closeGuide = () => {
  guideVisible.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === '1') {
    submitReview('pass')
  } else if (event.key === '2') {
    submitReview('reject')
  } else if (event.key === 'Enter') {
    getNextTask()
  } else if (event.key === 'Escape') {
    exitImmersiveMode()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)

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

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
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
  overflow: hidden;
}

.review-header {
  background-color: #fff;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.review-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.review-left,
.review-right {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.review-left {
  background-color: #fff;
}

.review-card {
  margin-bottom: 20px;
}

.material-preview {
  height: calc(100% - 200px);
}

.material-preview .el-card__body {
  height: calc(100% - 60px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-image,
iframe {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.review-actions {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.review-actions .el-button {
  padding: 15px 30px;
  font-size: 18px;
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.guide-content {
  margin-bottom: 20px;
}

.guide-content h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.guide-content ol {
  padding-left: 20px;
}

@media (max-width: 768px) {
  .review-content {
    flex-direction: column;
  }

  .review-left,
  .review-right {
    width: 100%;
  }

  .review-actions {
    flex-direction: column;
  }

  .review-actions .el-button {
    margin-bottom: 10px;
  }
}
</style>