<template>
    <div class="backend-management">
      <h1>后台管理</h1>
      
      <!-- 搜索输入框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户 (学号/姓名)"
        class="search-input"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
  
      <!-- 用户树状结构 -->
      <el-tree
        ref="userTree"
        :data="filteredUserData"
        :props="defaultProps"
        node-key="id"
        class="user-tree"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span>{{ data.name }} ({{ data.studentId }})</span>
            <!-- 进度条 -->
            <span class="progress-bar">
              <el-tooltip
                v-for="(item, index) in data.items"
                :key="index"
                :content="getTooltipContent(item)"
                placement="top"
              >
                <div 
                  :class="['progress-dot', { 'problem': item.isDone === 0, 'completed': item.finalDone }]"
                  @click="showItemDetails(item)"
                ></div>
              </el-tooltip>
            </span>
            <!-- 操作按钮 -->
            <span class="actions">
              <el-button size="small" @click="approveAll(data)">一键通过</el-button>
              <el-button size="small" type="danger" @click="rejectAll(data)">一键打回</el-button>
            </span>
          </span>
        </template>
      </el-tree>
  
      <!-- 申报详情对话框 -->
      <el-dialog v-model="dialogVisible" title="申报详情" width="50%">
        <el-form :model="currentItem" label-width="120px">
          <el-form-item label="文件ID">
            <el-input v-model="currentItem.FileID" disabled></el-input>
          </el-form-item>
          <el-form-item label="类别">
            <CategoryInfo :categoryCode="currentItem.categorycode" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="currentItem.status">
              <el-option label="待初审" :value="0"></el-option>
              <el-option label="初审通过" :value="1"></el-option>
              <el-option label="待终审" :value="2"></el-option>
              <el-option label="终审通过" :value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="currentItem.description" type="textarea"></el-input>
          </el-form-item>
          <el-form-item label="审核记录">
            <el-timeline>
              <el-timeline-item
                v-for="(review, index) in currentItem.reviews"
                :key="index"
                :timestamp="review.time"
                :type="review.result === 'approved' ? 'success' : 'danger'"
              >
                {{ review.reviewer }}: {{ review.comment }}
              </el-timeline-item>
            </el-timeline>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="updateItem">更新</el-button>
            <el-button type="danger" @click="deleteItem">删除</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { Search } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import axios from '@/http-common';
  import CategoryInfo from '@/components/CategoryInfo.vue';
  import authService from '@/services/authService';
  
  // 搜索查询
  const searchQuery = ref('');
  // 用户数据
  const userData = ref([]);
  // 控制对话框显示
  const dialogVisible = ref(false);
  // 当前选中的申报项
  const currentItem = ref({});
  
  // 树形控件的属性配置
  const defaultProps = {
    children: 'items',
    label: 'name'
  };
  
  // 根据搜索查询过滤用户数据
  const filteredUserData = computed(() => {
    if (!searchQuery.value) return userData.value;
    return userData.value.filter(user => 
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.studentId.includes(searchQuery.value)
    );
  });
  
  // 组件挂载时获取用户数据
  onMounted(async () => {
    await fetchUserData();
  });
  
  // 获取所有用户的申报数据
  const fetchUserData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('用户未登录');
  
      // 调用后端API获取所有用户的申报数据
      const response = await axios.get('/admin/getAllUserReports');
  
      if (response.data.statusID === 0) {
        userData.value = processUserData(response.data.data);
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
      ElMessage.error('获取用户数据失败，请稍后重试');
    }
  };
  
  // 处理API返回的数据，转换为树状结构
  const processUserData = (data) => {
    const userMap = new Map();
  
    Object.entries(data).forEach(([key, files]) => {
      if (Array.isArray(files)) {
        files.forEach(file => {
          if (!userMap.has(file.userID)) {
            userMap.set(file.userID, {
              id: file.userID,
              name: file.userName || 'Unknown',
              studentId: file.userID,
              items: []
            });
          }
          userMap.get(file.userID).items.push(file);
        });
      }
    });
  
    return Array.from(userMap.values());
  };
  
  // 处理搜索操作
  const handleSearch = () => {
    // 搜索逻辑已经通过 computed 属性实现
  };
  
  // 获取tooltip内容
  const getTooltipContent = (item) => {
    let status = '未知状态';
    if (item.finalDone) status = '终审通过';
    else if (item.isDone === 1) status = '初审通过';
    else if (item.isDone === 0) status = '待初审';
    return `${item.categorycode}: ${status}`;
  };
  
  // 显示申报项详情
  const showItemDetails = async (item) => {
    try {
      const response = await axios.post('/record/filestatus', { FileID: item.FileID });
      if (response.data.statusID === 1) {
        currentItem.value = { ...item, ...response.data };
        dialogVisible.value = true;
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.error('获取文件状态失败:', error);
      ElMessage.error('获取文件状态失败，请重试');
    }
  };
  
  // 一键通过所有申报
  const approveAll = async (user) => {
    try {
      await ElMessageBox.confirm(`确定要一键通过 ${user.name} 的所有申报吗？`, '确认操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('用户未登录');
  
      for (const item of user.items) {
        try {
          await axios.post('/admin/updateCaseFileStatus', {
            fileID: item.FileID,
            reviewerID: currentUser.StudentId,
            newIsDone: 3 // 3 表示终审通过
          });
        } catch (error) {
          console.error(`审核项目 ${item.FileID} 失败:`, error);
        }
      }
  
      ElMessage.success('批量审核完成');
      await fetchUserData(); // 刷新数据
    } catch (error) {
      if (error !== 'cancel') {
        console.error('一键通过失败:', error);
        ElMessage.error('操作失败，请重试');
      }
    }
  };
  
  // 一键打回所有申报
  const rejectAll = async (user) => {
    try {
      await ElMessageBox.confirm(`确定要一键打回 ${user.name} 的所有申报吗？`, '确认操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('用户未登录');
  
      for (const item of user.items) {
        try {
          await axios.post('/admin/updateCaseFileStatus', {
            fileID: item.FileID,
            reviewerID: currentUser.StudentId,
            newIsDone: 0 // 0 表示打回/拒绝
          });
        } catch (error) {
          console.error(`拒绝项目 ${item.FileID} 失败:`, error);
        }
      }
  
      ElMessage.success('批量拒绝完成');
      await fetchUserData(); // 刷新数据
    } catch (error) {
      if (error !== 'cancel') {
        console.error('一键打回失败:', error);
        ElMessage.error('操作失败，请重试');
      }
    }
  };
  
  // 更新单个申报项
  const updateItem = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('用户未登录');
  
      const response = await axios.post('/admin/updateCaseFileStatus', {
        fileID: currentItem.value.FileID,
        reviewerID: user.StudentId,
        newIsDone: currentItem.value.status
      });
  
      if (response.data.statusID === 0) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        await fetchUserData(); // 刷新数据
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.error('更新失败:', error);
      ElMessage.error('更新失败，请重试');
    }
  };
  
  // 删除单个申报项
  const deleteItem = async () => {
    try {
      await ElMessageBox.confirm('确定要删除这个申报项吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      const user = authService.getCurrentUser();
      if (!user) throw new Error('用户未登录');
  
      const response = await axios.post('/record/deleterecord', {
        fileID: currentItem.value.FileID,
        userID: user.StudentId
      });
  
      if (response.data.statusID === 1) {
        ElMessage.success('删除成功');
        dialogVisible.value = false;
        await fetchUserData(); // 刷新数据
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error);
        ElMessage.error('删除失败，请重试');
      }
    }
  };
  </script>
  
  <style scoped>
  .backend-management {
    padding: 20px;
  }
  
  .search-input {
    margin-bottom: 20px;
    width: 300px;
  }
  
  .user-tree {
    margin-top: 20px;
  }
  
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
  }
  
  .progress-bar {
    display: flex;
    align-items: center;
    margin: 0 20px;
  }
  
  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #67C23A;
    margin: 0 5px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .progress-dot.problem {
    background-color: #F56C6C;
  }
  
  .progress-dot.completed {
    background-color: #409EFF;
    box-shadow: 0 0 5px #409EFF;
  }
  
  .progress-dot:hover {
    transform: scale(1.2);
  }
  
  .actions {
    display: flex;
    gap: 10px;
  }
  </style>