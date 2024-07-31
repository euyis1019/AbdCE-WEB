<template>
  <div class="home">
    <h1>欢迎使用综合评价信息申报系统</h1>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button class="button" text>编辑</el-button>
            </div>
          </template>
          <div class="text item">
            <p>姓名：{{ userInfo.name }}</p>
            <p>学号：{{ userInfo.studentId }}</p>
            <p>班级：{{ userInfo.class }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>申报状态</span>
              <el-button class="button" text @click="goToReportState">查看详情</el-button>
            </div>
          </template>
          <div class="text item">
            <el-progress :percentage="reportProgress" :format="format"></el-progress>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="text item">
            <el-button @click="goToReportForm">填写申报</el-button>
            <el-button @click="goToReportState">查看进度</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const userInfo = ref({
  name: '张三',
  studentId: '20223800000',
  class: '软件工程2班'
})

const reportProgress = ref(30)

const format = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

const goToReportForm = () => {
  router.push('/report')
}

const goToReportState = () => {
  router.push('/state')
}

onMounted(() => {
  // 在这里可以添加获取用户信息和申报进度的逻辑
})
</script>

<style scoped>
.home {
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

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}
</style>