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
            <el-table-column label="类别" prop="categoryCode">
              <template #default="scope">
                <CategoryInfo :categoryCode="scope.row.categoryCode" />
              </template>
            </el-table-column>
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
        <el-form-item label="类别">
          <CategoryInfo :categoryCode="assignForm.categoryCode" />
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
import CategoryInfo from '../components/CategoryInfo.vue'

interface Assignment {
  categoryCode: string;
  reviewers: string[];
}

const assignmentData = ref<Assignment[]>([]);
const reviewers = ref([]);
const assignDialogVisible = ref(false);
const assignForm = ref({
  categoryCode: '',
  reviewerId: ''
});

const isAllAssigned = computed(() => {
  return assignmentData.value.every(item => item.reviewers.length > 0);
});

const refreshAssignments = async () => {
  try {
    const response = await axios.get('/admin/getAssignedReviewers');
    if (response.data.statusID === 0) {
      assignmentData.value = Object.entries(response.data.data).map(([categoryCode, reviewers]) => ({
        categoryCode,
        reviewers: reviewers as string[]
      }));
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('获取审核员分配情况失败:', error);
    ElMessage.error('获取审核员分配情况失败，请稍后重试');
  }
};

const fetchReviewers = async () => {
  try {
    const response = await axios.get('/admin/getReviewers');
    if (response.data.statusID === 0) {
      reviewers.value = response.data.reviewer;
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('获取审核员列表失败:', error);
    ElMessage.error('获取审核员列表失败，请稍后重试');
  }
};

const openAssignDialog = (row: Assignment) => {
  assignForm.value.categoryCode = row.categoryCode;
  assignForm.value.reviewerId = '';
  assignDialogVisible.value = true;
};

const submitAssignment = async () => {
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const existingReviewers = assignmentData.value.find(item => item.categoryCode === assignForm.value.categoryCode)?.reviewers || [];

    if (existingReviewers.length > 0) {
      const response = await axios.post('/admin/updateReviewerStatus', {
        userID: assignForm.value.reviewerId,
        reviewer: true,
        categoryCode: assignForm.value.categoryCode
      });
      if (response.data.statusID === 0) {
        ElMessage.success('审核员状态更新成功');
        assignDialogVisible.value = false;
        refreshAssignments();
      } else {
        throw new Error(response.data.msg);
      }
    } else {
      const response = await axios.post('/admin/assignTask', {
        adminID: user.ID,
        reviewerID: assignForm.value.reviewerId,
        categoryCodes: [assignForm.value.categoryCode]
      });
      if (response.data.statusID === 0) {
        ElMessage.success('分配成功');
        assignDialogVisible.value = false;
        refreshAssignments();
      } else {
        throw new Error(response.data.msg);
      }
    }
  } catch (error) {
    console.error('分配审核员失败:', error);
    ElMessage.error('分配审核员失败，请稍后重试');
  }
};

onMounted(() => {
  refreshAssignments();
  fetchReviewers();
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
