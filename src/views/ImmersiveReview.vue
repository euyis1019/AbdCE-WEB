<template>
  <div class="immersive-review">
    <header class="review-header">
      <el-button @click="exitReview" type="text" icon="ArrowLeft">退出审核</el-button>
      <h2>
        <CategoryInfo :categoryCode="currentTask.categorycode" />
        - {{ currentTask.userID }}
      </h2>
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
          <el-image v-if="currentTask.file" :src="currentTask.file" fit="contain" />
          <p v-else>无可预览材料</p>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Close } from '@element-plus/icons-vue'
import axios from '../http-common'
import authService from '../services/authService'
import CategoryInfo from '../components/CategoryInfo.vue'

const router = useRouter()
const route = useRoute()

const confirmDialogVisible = ref(false)
const guideVisible = ref(true)

const currentTask = ref({
  FileID: '',
  caseID: '',
  userID: '',
  mainCLs: '',
  cls1: '',
  cls2: '',
  point: '',
  page: '',
  file: '',
  reviewercode: '',
  categorycode: '',
  isActive: true,
  isDone: false,
  priority: 0,
  applicationTime: '',
  rules: ''
})

const reviewerName = ref('')

const reviewForm = ref({
  result: '',
  score: 0,
  comment: '',
})

const isAdmin = computed(() => {
  const user = authService.getCurrentUser()
  return user && user.Permission === '3'
})

const exitReview = () => {
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
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const endpoint = isAdmin.value ? '/admin/finalDone' : '/admin/isdone';
    const payload: { [key: string]: any } = {
      userID: user.ID,
      FileID: currentTask.value.FileID,
      reviewerID: user.ID,
      comment: reviewForm.value.comment,
      score: reviewForm.value.score
    };

    if (isAdmin.value) {
      payload.finalDone = reviewForm.value.result === 'pass';
    } else {
      payload.isDone = reviewForm.value.result === 'pass';
    }

    const response = await axios.post(endpoint, payload);
    
    if (response.data.statusID === 1) {
      ElMessage.success('审核结果已提交');
      confirmDialogVisible.value = false;
      await getNextTask();
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('提交审核结果失败:', error);
    ElMessage.error('提交审核结果失败，请重试');
  }
}

const getNextTask = async () => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.get('/admin/getCE', {
      userID: user.ID
    })
    
    if (response.data.statusID === 0) {
      const taskList = isAdmin.value ? response.data.data.finalTodoList.files : response.data.data.reviewTodoList.files;
      if (taskList.length > 0) {
        currentTask.value = taskList[0]
        reviewForm.value = {
          result: '',
          score: 0,
          comment: '',
        }
      } else {
        ElMessage.info('所有任务已审核完毕')
        exitReview()
      }
    } else {
      throw new Error(response.data.msg)
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
    exitReview()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)
  const user = authService.getCurrentUser()
  reviewerName.value = user?.Name || '未知审核员'
  await getNextTask()
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