<template>
  <div class="data-dashboard">
    <h1>数据看板</h1>
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>审核进度概览</span>
            </div>
          </template>
          <el-table :data="reviewProgress" style="width: 100%">
            <el-table-column prop="name" label="姓名"></el-table-column>
            <el-table-column prop="class" label="班级"></el-table-column>
            <el-table-column prop="progress" label="进度">
              <template #default="scope">
                <el-progress :percentage="scope.row.progress"></el-progress>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from '../http-common';
import authService from '../services/authService';

// 审核进度数据
const reviewProgress = ref([]);

// 组件挂载时执行
onMounted(async () => {
  await fetchReviewProgress();
});

// 获取审核进度的方法
const fetchReviewProgress = async () => {
  try {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/record/userstatus', {
      userID: user.ID
    })

    if (response.data.statusID === 1) {
      const total = response.data.reviewTodoCount + response.data.reviewDoneCount + 
                    response.data.finalTodoCount + response.data.finalDoneCount;
      const completed = response.data.finalDoneCount;
      
      reviewProgress.value = [{
        name: user.Name,
        class: user.Class,
        progress: Math.round((completed / total) * 100)
      }];
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取审核进度失败:', error)
    ElMessage.error('获取审核进度失败，请稍后重试')
  }
};
</script>

<style scoped>
.data-dashboard {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>