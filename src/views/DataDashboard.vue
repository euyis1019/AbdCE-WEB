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
import axios from '../http-common'; // 引入 axios 实例

// 审核进度数据
const reviewProgress = ref([]);

// 组件挂载时执行
onMounted(async () => {
  await fetchReviewProgress(); // 获取审核进度
});

// 获取审核进度的方法
const fetchReviewProgress = async () => {
  try {
    // 这里应该替换为实际的API调用
    const response = await axios.get('/api/review-progress'); // 使用 axios 实例发送请求
    // 如果请求成功
    if (response.data.statusID === 0) { 
      // 设置审核进度数据
      reviewProgress.value = response.data.progress; 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理获取审核进度失败的错误
    console.error('获取审核进度失败:', error); 
    ElMessage.error('获取审核进度失败，请稍后重试');
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