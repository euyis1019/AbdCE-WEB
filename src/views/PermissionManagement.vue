<template>
  <div class="permission-management">
    <h1 class="page-title">权限与审核员分配管理</h1>
    
    <el-card class="category-tree-card">
      <template #header>
        <div class="card-header">
          <h2>类别审核员分配</h2>
          <div class="header-actions">
            <el-button type="primary" @click="autoAssignReviewers" :loading="autoAssigning">自动分配审核员</el-button>
            <el-button @click="refreshCategoryTree">刷新</el-button>
          </div>
        </div>
      </template>
      <el-scrollbar height="calc(50vh - 120px)">
        <el-tree
          ref="categoryTreeRef"
          :data="categoryTree"
          node-key="id"
          :props="defaultProps"
          :expand-on-click-node="false"
          default-expand-all
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ node.label }}</span>
              <span v-if="data.isLeaf" class="reviewer-tags">
                <el-tag 
                  v-for="reviewer in data.reviewers" 
                  :key="reviewer.id" 
                  closable 
                  @close="showRemoveConfirmDialog(data, reviewer)"
                  :type="getReviewerTagType(reviewer.level)"
                >
                  {{ reviewer.id }} ({{ getReviewerLevelLabel(reviewer.level) }})
                </el-tag>
                <el-button v-if="data.reviewers.length < 2" size="small" @click.stop="showAssignDialog(data)">
                  分配审核员
                </el-button>
              </span>
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
    </el-card>

    <el-card class="user-permissions-card">
      <template #header>
        <div class="card-header">
          <h2>用户权限管理</h2>
          <el-button @click="refreshUserPermissions">刷新</el-button>
        </div>
      </template>
      <el-scrollbar height="calc(50vh - 120px)">
        <el-table :data="userPermissions" style="width: 100%">
          <el-table-column prop="id" label="用户ID" width="120"></el-table-column>
          <el-table-column prop="level" label="当前权限等级" width="120">
            <template #default="scope">
              {{ getReviewerLevelLabel(scope.row.level) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240">
            <template #default="scope">
              <el-select
                v-model="scope.row.newLevel"
                placeholder="选择新权限等级"
                @change="(value) => handlePermissionChange(value, scope.row)"
              >
                <el-option label="普通用户" :value="0"></el-option>
                <el-option label="审核员" :value="10"></el-option>
                <el-option label="管理员" :value="20"></el-option>
                <el-option label="超级管理员" :value="30"></el-option>
              </el-select>
              <el-button
                type="primary"
                size="small"
                @click="updateUserPermission(scope.row)"
                :disabled="scope.row.level === scope.row.newLevel"
              >更新</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </el-card>

    <el-dialog v-model="assignDialogVisible" title="分配审核员" width="30%">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="类别">
          {{ assignForm.categoryName }}
        </el-form-item>
        <el-form-item label="审核员">
          <el-select v-model="assignForm.reviewerId" placeholder="请选择审核员">
            <el-option
              v-for="reviewer in allReviewers"
              :key="reviewer.id"
              :label="`${reviewer.id} (${getReviewerLevelLabel(reviewer.level)})`"
              :value="reviewer.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="assignReviewer">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="removeConfirmDialogVisible"
      title="确认移除审核员"
      width="30%"
    >
      <span>您确定要移除该审核员吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="removeConfirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRemoveReviewer">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import axios from '../http-common'
import authService from '../services/authService'

const categoryTreeRef = ref<InstanceType<typeof ElTree>>()
const categoryTree = ref([])
const userPermissions = ref([])
const assignDialogVisible = ref(false)
const removeConfirmDialogVisible = ref(false)
const autoAssigning = ref(false)
const assignForm = ref({
  categoryId: '',
  categoryName: '',
  reviewerId: ''
})
const assignedReviewers = ref({})

const reviewerToRemove = ref(null)
const nodeToUpdate = ref(null)

const defaultProps = {
  children: 'children',
  label: 'label',
}

const allReviewers = computed(() => {
  const currentReviewers = assignedReviewers.value[assignForm.value.categoryId] || []
  return userPermissions.value.filter(user => 
    user.level > 0 && !currentReviewers.includes(user.id)
  )
})

const availableReviewers = computed(() => {
  const currentReviewers = assignedReviewers.value[assignForm.value.categoryId] || []
  return userPermissions.value.filter(user => 
    user.level > 0 && user.level < 30 && !currentReviewers.includes(user.id)
  )
})

onMounted(async () => {
  await fetchAssignedReviewers()
  await fetchUserPermissions()
  await fetchCategoryTree()
})

const fetchAssignedReviewers = async () => {
  try {
    const response = await axios.get('/admin/getAssignedReviewers')
    if (response.data.statusID === 0) {
      assignedReviewers.value = response.data.data
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取已分配审核员失败:', error)
    ElMessage.error('获取已分配审核员失败，请稍后重试')
  }
}

const fetchCategoryTree = async () => {
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryTree.value = convertTreeFormat(response.data.data)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取类别树失败:', error)
    ElMessage.error('获取类别树失败，请稍后重试')
  }
}

const convertTreeFormat = (tree, parentId = null) => {
  return Object.entries(tree).map(([key, value], index) => {
    const node = {
      id: parentId ? `${parentId}-${index}` : `${index}`,
      label: key,
      isLeaf: false,
      reviewers: [],
    }

    if (typeof value === 'object' && value !== null && !('caseID' in value)) {
      node.children = convertTreeFormat(value, node.id)
    } else if ('caseID' in value) {
      node.isLeaf = true
      node.caseID = value.caseID
      // 修复：正确获取用户权限等级
      if (assignedReviewers.value[value.caseID]) {
        node.reviewers = assignedReviewers.value[value.caseID].map(id => ({
          id,
          level: userPermissions.value.find(user => user.id === id)?.level || 0
        }))
      }
    }

    return node
  })
}

const fetchUserPermissions = async () => {
  try {
    const response = await axios.get('/admin/adminlevel')
    if (response.data.message === "Administrators retrieved successfully") {
      userPermissions.value = Object.entries(response.data.groupedAdmins).flatMap(([level, userIds]) =>
        userIds.map(id => ({ id, level: parseInt(level), newLevel: parseInt(level) }))
      )
    } else {
      throw new Error('Failed to retrieve administrators')
    }
  } catch (error) {
    console.error('获取用户权限失败:', error)
    ElMessage.error('获取用户权限失败，请稍后重试')
  }
}

const showAssignDialog = (data) => {
  assignForm.value.categoryId = data.caseID
  assignForm.value.categoryName = data.label
  assignForm.value.reviewerId = ''
  assignDialogVisible.value = true
}

const assignReviewer = async () => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    // 首先，设置用户的审核员状态
    const statusResponse = await axios.post('/admin/updateReviewerStatus', {
      userID: assignForm.value.reviewerId,
      reviewer: true
    })

    if (statusResponse.data.statusID !== 0) {
      throw new Error(statusResponse.data.msg)
    }

    // 然后，分配任务
    const assignResponse = await axios.post('/admin/assignTask', {
      adminID: currentUser.ID,
      reviewerID: assignForm.value.reviewerId,
      categoryCodes: [assignForm.value.categoryId]
    })

    if (assignResponse.data.statusID === 0) {
      ElMessage.success('审核员分配成功')
      assignDialogVisible.value = false
      await fetchAssignedReviewers()  // 重新获取已分配的审核员信息
      await refreshCategoryTree()
    } else {
      throw new Error(assignResponse.data.msg)
    }
  } catch (error) {
    console.error('分配审核员失败:', error)
    ElMessage.error('分配审核员失败，请稍后重试')
  }
}

const showRemoveConfirmDialog = (data, reviewer) => {
  reviewerToRemove.value = reviewer
  nodeToUpdate.value = data
  removeConfirmDialogVisible.value = true
}

const confirmRemoveReviewer = async () => {
  removeConfirmDialogVisible.value = false
  if (reviewerToRemove.value && nodeToUpdate.value) {
    await removeReviewer(nodeToUpdate.value, reviewerToRemove.value)
  }
}

const removeReviewer = async (data, reviewer) => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/admin/updateReviewerStatus', {
      userID: reviewer.id,
      reviewer: false
    })

    if (response.data.statusID === 0) {
      ElMessage.success('审核员移除成功')
      // 从已分配的审核员列表中移除该审核员
      if (assignedReviewers.value[data.caseID]) {
        assignedReviewers.value[data.caseID] = assignedReviewers.value[data.caseID].filter(id => id !== reviewer.id)
      }
      // 刷新类别树以更新UI
      await refreshCategoryTree()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('移除审核员失败:', error)
    ElMessage.error('移除审核员失败，请稍后重试')
  }
}

const handlePermissionChange = (value, user) => {
  user.newLevel = value
}

const updateUserPermission = async (user) => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/admin/updateadmin', {
      userID: currentUser.ID,
      updateuserID: user.id,
      level: user.newLevel
    })

    if (response.data.statusID === 0) {
      ElMessage.success('用户权限更新成功')
      user.level = user.newLevel
      await fetchUserPermissions() // 刷新用户权限列表
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('更新用户权限失败:', error)
    ElMessage.error('更新用户权限失败，请稍后重试')
  }
}

const refreshCategoryTree = async () => {
  await fetchCategoryTree()
  if (categoryTreeRef.value) {
    categoryTreeRef.value.store.setData(categoryTree.value)
  }
}

const refreshUserPermissions = async () => {
  await fetchUserPermissions()
}

const getReviewerLevelLabel = (level) => {
  switch (level) {
    case 10: return '审核员'
    case 20: return '管理员'
    case 30: return '超级管理员'
    default: return '普通用户'
  }
}

const getReviewerTagType = (level) => {
  switch (level) {
    case 10: return ''
    case 20: return 'warning'
    case 30: return 'danger'
    default: return 'info'
  }
}

const autoAssignReviewers = async () => {
  autoAssigning.value = true
  try {
    const eligibleReviewers = userPermissions.value.filter(reviewer => reviewer.level > 0 && reviewer.level < 30)
    if (eligibleReviewers.length < 2) {
      ElMessage.warning('没有足够的合格审核员进行自动分配')
      return
    }

    const leafNodes = getLeafNodes(categoryTree.value)
    const assignments = {}

    for (const node of leafNodes) {
      const currentReviewers = assignedReviewers.value[node.caseID] || []
      const availableForNode = eligibleReviewers.filter(r => !currentReviewers.includes(r.id))

      while (currentReviewers.length < 2 && availableForNode.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableForNode.length)
        const selectedReviewer = availableForNode.splice(randomIndex, 1)[0]
        currentReviewers.push(selectedReviewer.id)

        if (!assignments[selectedReviewer.id]) {
          assignments[selectedReviewer.id] = []
        }
        assignments[selectedReviewer.id].push(node.caseID)
      }
    }

    // 调用后端 API 进行批量分配
    for (const [reviewerId, categoryCodes] of Object.entries(assignments)) {
      await axios.post('/admin/assignTask', {
        adminID: authService.getCurrentUser().ID,
        reviewerID: reviewerId,
        categoryCodes: categoryCodes
      })
    }

    ElMessage.success('自动分配审核员完成')
    await fetchAssignedReviewers()  // 重新获取已分配的审核员信息
    await refreshCategoryTree()
  } catch (error) {
    console.error('自动分配审核员失败:', error)
    ElMessage.error('自动分配审核员失败，请稍后重试')
  } finally {
    autoAssigning.value = false
  }
}

const getLeafNodes = (nodes) => {
  let leafNodes = []
  for (const node of nodes) {
    if (node.isLeaf) {
      leafNodes.push(node)
    } else if (node.children) {
      leafNodes = leafNodes.concat(getLeafNodes(node.children))
    }
  }
  return leafNodes
}
</script>

<style scoped>
.permission-management {
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.category-tree-card,
.user-permissions-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.el-scrollbar {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.reviewer-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.el-tag {
  margin-right: 5px;
}

.el-table {
  width: 100%;
}

.el-select {
  width: 140px;
}

@media (max-width: 768px) {
  .permission-management {
    padding: 10px;
    height: calc(100vh - 20px);
  }

  .category-tree-card,
  .user-permissions-card {
    margin-bottom: 10px;
  }

  .el-scrollbar {
    height: calc(40vh - 100px) !important;
  }

  .el-select {
    width: 100%;
  }
}
</style>