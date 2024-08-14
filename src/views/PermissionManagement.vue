<template>
  <div class="permission-management">
    <h1 class="page-title">
      审核员分配管理
      <el-tag :type="isAllAssigned ? 'success' : 'warning'" effect="dark">
        {{ isAllAssigned ? '全部已分配' : '存在未分配项目' }}
      </el-tag>
    </h1>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="24">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>当前分配情况</span>
              <el-button type="primary" @click="refreshAssignments">刷新</el-button>
            </div>
          </template>
          <el-table :data="assignmentData" style="width: 100%">
            <el-table-column prop="categoryCode" label="类别代码"></el-table-column>
            <el-table-column prop="reviewers" label="审核员">
              <template #default="scope">
                {{ scope.row.reviewers.join(', ') }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" type="primary" @click="openAssignDialog(scope.row)">分配审核员</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="assignDialogVisible" title="分配审核员" width="30%">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="类别代码">
          <span>{{ assignForm.categoryCode }}</span>
        </el-form-item>
        <el-form-item label="审核员">
          <el-select v-model="assignForm.reviewerId" placeholder="请选择审核员" style="width: 100%;">
            <el-option
              v-for="reviewer in reviewers"
              :key="reviewer.id"
              :label="reviewer.name"
              :value="reviewer.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignment">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '../http-common'
import authService from '../services/authService'

// 定义分配情况接口
interface Assignment {
  categoryCode: string;
  reviewers: string[];
}

// 分配数据
const assignmentData = ref<Assignment[]>([]);
// 审核员列表
const reviewers = ref([]);
// 分配对话框可见性
const assignDialogVisible = ref(false);
// 分配表单数据
const assignForm = ref({
  categoryCode: '',
  reviewerId: ''
});

// 计算是否所有项目都已分配审核员
const isAllAssigned = computed(() => {
  return assignmentData.value.every(item => item.reviewers.length > 0);
});

// 刷新分配情况的方法
const refreshAssignments = async () => {
  try {
    // 获取已分配的审核员信息
    const response = await axios.get('/admin/getAssignedReviewers'); 
    // 如果请求成功
    if (response.data.statusID === 0) { 
      // 处理响应数据，将其转换为前端所需的格式
      assignmentData.value = Object.entries(response.data.data).map(([categoryCode, reviewers]) => ({
        categoryCode,
        reviewers: reviewers as string[]
      }));
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理获取审核员分配情况失败的错误
    console.error('获取审核员分配情况失败:', error); 
    ElMessage.error('获取审核员分配情况失败，请稍后重试');
  }
};

// 获取审核员列表的方法
const fetchReviewers = async () => {
  try {
    // 获取审核员列表
    const response = await axios.get('/admin/getReviewers'); 
    // 如果请求成功
    if (response.data.statusID === 0) { 
      // 设置审核员列表
      reviewers.value = response.data.reviewer; 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理获取审核员列表失败的错误
    console.error('获取审核员列表失败:', error); 
    ElMessage.error('获取审核员列表失败，请稍后重试');
  }
};

// 打开分配审核员对话框的方法
const openAssignDialog = (row: Assignment) => {
  // 设置分配表单数据
  assignForm.value.categoryCode = row.categoryCode;
  assignForm.value.reviewerId = '';
  // 显示分配对话框
  assignDialogVisible.value = true; 
};

// 提交分配的方法
const submitAssignment = async () => {
  try {
    // 获取当前用户信息
    const user = authService.getCurrentUser(); 
    // 如果用户未登录
    if (!user) { 
      // 抛出错误
      throw new Error('用户未登录'); 
    }

    // 提交分配任务
    const response = await axios.post('/admin/assignTask', {
      adminID: user.ID, // 使用当前用户的 ID
      reviewerID: assignForm.value.reviewerId,
      categoryCodes: [assignForm.value.categoryCode]
    });
    // 如果请求成功
    if (response.data.statusID === 0) { 
      // 显示分配成功的提示信息
      ElMessage.success('分配成功'); 
      // 关闭分配对话框
      assignDialogVisible.value = false; 
      // 刷新分配情况
      refreshAssignments(); 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理分配审核员失败的错误
    console.error('分配审核员失败:', error); 
    ElMessage.error('分配审核员失败，请稍后重试');
  }
};

// 组件挂载时执行
onMounted(() => {
  refreshAssignments(); // 刷新分配情况
  fetchReviewers(); // 获取审核员列表
});
</script>

<style scoped>
.permission-management {
  padding: 20px;
}

.page-title {
  color: #303133;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.page-title .el-tag {
  margin-left: 10px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .permission-management {
    padding: 10px;
  }

  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }
}
</style>