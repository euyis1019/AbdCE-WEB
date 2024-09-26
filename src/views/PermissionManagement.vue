<template>
  <div class="permission-management">
    <h1 class="page-title">权限与审核员分配管理</h1>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12">
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
          <el-scrollbar height="calc(100vh - 250px)">
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
                      :key="reviewer.userID" 
                      closable 
                      @close="showRemoveConfirmDialog(data, reviewer)"
                      :type="getReviewerTagType(reviewer.level)"
                    >
                      {{ getReviewerDisplayName(reviewer) }} - {{ getReviewerLevelLabel(reviewer.level) }}
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
      </el-col>

      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="user-permissions-card">
          <template #header>
            <div class="card-header">
              <h2>用户权限管理</h2>
              <el-input
                v-model="searchQuery"
                placeholder="搜索用户 (任意字段)"
                style="width: 200px; margin-right: 10px;"
                @input="debouncedSearch"
              />
              <el-button @click="refreshUserPermissions">刷新</el-button>
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 320px)">
            <el-table :data="paginatedUserPermissions" style="width: 100%">
              <el-table-column prop="userID" label="用户ID" width="120"></el-table-column>
              <el-table-column prop="name" label="用户姓名" width="120" v-if="hasNameField"></el-table-column>
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
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredUserPermissions.length"
          >
          </el-pagination>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="assignDialogVisible" title="分配审核员" width="30%">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="类别">
          {{ assignForm.categoryName }}
        </el-form-item>
        <el-form-item label="审核员">
          <el-select v-model="assignForm.reviewerId" placeholder="请选择审核员">
            <el-option
              v-for="reviewer in availableReviewers"
              :key="reviewer.userID"
              :label="getReviewerDisplayName(reviewer)"
              :value="reviewer.userID"
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

    <el-dialog
      v-model="autoAssignDialogVisible"
      title="自动分配审核员"
      width="50%"
    >
      <el-progress
        v-if="autoAssigning"
        :percentage="autoAssignProgress"
        :format="formatAutoAssignProgress"
      ></el-progress>
      <div v-else>
        <h3>分配结果</h3>
        <el-table :data="autoAssignResults" style="width: 100%">
          <el-table-column prop="category" label="大类"></el-table-column>
          <el-table-column prop="assignedReviewers" label="分配的审核员"></el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="autoAssignDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import axios from '../http-common'
import authService from '../services/authService'
import { debounce } from 'lodash'

// 树形控件的引用
const categoryTreeRef = ref<InstanceType<typeof ElTree>>()
// 类别树数据
const categoryTree = ref([])
// 用户权限数据
const userPermissions = ref([])
// 控制分配对话框的显示
const assignDialogVisible = ref(false)
// 控制移除确认对话框的显示
const removeConfirmDialogVisible = ref(false)
// 控制是否正在自动分配
const autoAssigning = ref(false)
// 控制自动分配对话框的显示
const autoAssignDialogVisible = ref(false)
// 自动分配进度
const autoAssignProgress = ref(0)
// 自动分配结果
const autoAssignResults = ref([])
// 分配表单数据
const assignForm = ref({
  categoryId: '',
  categoryName: '',
  reviewerId: ''
})
// 已分配的审核员
const assignedReviewers = ref({})

// 要移除的审核员
const reviewerToRemove = ref(null)
// 要更新的节点
const nodeToUpdate = ref(null)

// 搜索查询
const searchQuery = ref('')
// 当前页码
const currentPage = ref(1)
// 每页显示数量
const pageSize = ref(20)

// 树形控件的属性配置
const defaultProps = {
  children: 'children',
  label: 'label',
}

// 计算属性：判断是否有name字段
const hasNameField = computed(() => {
  return userPermissions.value.some(user => 'name' in user)
})

// 计算属性：获取可用的审核员
const availableReviewers = computed(() => {
  const currentReviewers = assignedReviewers.value[assignForm.value.categoryId] || []
  return userPermissions.value.filter(user => 
    user.level > 0 && !currentReviewers.includes(user.userID)
  )
})

// 计算属性：根据搜索过滤用户权限
const filteredUserPermissions = computed(() => {
  if (!searchQuery.value) return userPermissions.value

  const lowercaseQuery = searchQuery.value.toLowerCase()
  return userPermissions.value.filter(user => 
    Object.values(user).some(value => 
      String(value).toLowerCase().includes(lowercaseQuery)
    )
  )
})

// 计算属性：获取分页后的用户权限
const paginatedUserPermissions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredUserPermissions.value.slice(startIndex, endIndex)
})

// 防抖处理的搜索函数
const debouncedSearch = debounce(() => {
  currentPage.value = 1
}, 300)

// 组件挂载时执行
onMounted(async () => {
  await fetchAssignedReviewers()
  await fetchUserPermissions()
  await fetchCategoryTree()
})

// 获取已分配的审核员
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

// 获取类别树
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

// 转换树形格式
const convertTreeFormat = (tree, parentId = null) => {
  return Object.entries(tree).map(([key, value], index) => {
    const node = {
      id: parentId ? `${parentId}-${index}` : `${index}`,
      label: key,
      isLeaf: false,
      reviewers: [],
    }

    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value) {
        node.isLeaf = true;
        node.caseID = value.caseID;
        if (assignedReviewers.value[value.caseID]) {
          node.reviewers = assignedReviewers.value[value.caseID].map(id => {
            const user = userPermissions.value.find(u => u.userID === id);
            return user ? {
              userID: user.userID,
              name: user.name,
              level: user.level
            } : null;
          }).filter(Boolean);
        }
      } else {
        node.children = convertTreeFormat(value, node.id);
      }
    }

    return node;
  });
}

// 获取用户权限
const fetchUserPermissions = async () => {
  try {
    const response = await axios.get('/admin/adminlevel')
    if (response.data.message === "Administrators retrieved successfully") {
      userPermissions.value = Object.entries(response.data.groupedAdmins).flatMap(([level, users]) =>
        users.map(user => ({
          userID: user.userID,
          name: user.name, // 如果后端返回 name 字段，这里会自动包含
          level: parseInt(level),
          newLevel: parseInt(level)
        }))
      )
    } else {
      throw new Error('Failed to retrieve administrators')
    }
  } catch (error) {
    console.error('获取用户权限失败:', error)
    ElMessage.error('获取用户权限失败，请稍后重试')
  }
}

// 显示分配对话框
const showAssignDialog = (data) => {
  assignForm.value.categoryId = data.caseID
  assignForm.value.categoryName = data.label
  assignForm.value.reviewerId = ''
  assignDialogVisible.value = true
}

// 分配审核员
const assignReviewer = async () => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    const statusResponse = await axios.post('/admin/updateReviewerStatus', {
      userID: assignForm.value.reviewerId,
      reviewer: true
    })

    if (statusResponse.data.statusID !== 0) {
      throw new Error(statusResponse.data.msg)
    }

    const assignResponse = await axios.post('/admin/assignTask', {
      adminID: currentUser.StudentId,
      reviewerID: assignForm.value.reviewerId,
      categoryCodes: [assignForm.value.categoryId]
    })

    if (assignResponse.data.statusID === 0) {
      ElMessage.success('审核员分配成功')
      assignDialogVisible.value = false
      await fetchAssignedReviewers()
      await refreshCategoryTree()
    } else {
      throw new Error(assignResponse.data.msg)
    }
  } catch (error) {
    console.error('分配审核员失败:', error)
    ElMessage.error('分配审核员失败，请稍后重试')
  }
}

// 显示移除确认对话框
const showRemoveConfirmDialog = (data, reviewer) => {
  reviewerToRemove.value = reviewer
  nodeToUpdate.value = data
  removeConfirmDialogVisible.value = true
}

// 确认移除审核员
const confirmRemoveReviewer = async () => {
  removeConfirmDialogVisible.value = false
  if (reviewerToRemove.value && nodeToUpdate.value) {
    await removeReviewer(nodeToUpdate.value, reviewerToRemove.value)
  }
}

// 移除审核员
const removeReviewer = async (data, reviewer) => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/admin/updateReviewerStatus', {
      userID: reviewer.userID,
      reviewer: false
    })

    if (response.data.statusID === 0) {
      ElMessage.success('审核员移除成功')
      if (assignedReviewers.value[data.caseID]) {
        assignedReviewers.value[data.caseID] = assignedReviewers.value[data.caseID].filter(id => id !== reviewer.userID)
      }
      await refreshCategoryTree()
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('移除审核员失败:', error)
    ElMessage.error('移除审核员失败，请稍后重试')
  }
}

// 处理权限变更
const handlePermissionChange = (value, user) => {
  user.newLevel = value
}

// 更新用户权限
const updateUserPermission = async (user) => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    const response = await axios.post('/admin/updateadmin', {
      userID: currentUser.StudentId,
      updateuserID: user.userID,
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

// 刷新类别树
const refreshCategoryTree = async () => {
  await fetchCategoryTree()
  if (categoryTreeRef.value) {
    categoryTreeRef.value.store.setData(categoryTree.value)
  }
}

// 刷新用户权限
const refreshUserPermissions = async () => {
  await fetchUserPermissions()
}

// 获取审核员等级标签
const getReviewerLevelLabel = (level) => {
  switch (level) {
    case 10: return '审核员'
    case 20: return '管理员'
    case 30: return '超级管理员'
    default: return '普通用户'
  }
}

// 获取审核员标签类型
const getReviewerTagType = (level) => {
  switch (level) {
    case 10: return ''
    case 20: return 'warning'
    case 30: return 'danger'
    default: return 'info'
  }
}

// 获取审核员显示名称
const getReviewerDisplayName = (reviewer) => {
  if (reviewer.name) return reviewer.name
  if (reviewer.userID) return `用户ID: ${reviewer.userID}`
  return '未知用户'
}

// 自动分配审核员
const autoAssignReviewers = async () => {
  autoAssigning.value = true
  autoAssignDialogVisible.value = true
  autoAssignProgress.value = 0
  autoAssignResults.value = []

  let retryCount = 0
  const maxRetries = 1
  const requestTimeout = 3000 // 3秒

  const runAutoAssign = async () => {
    try {
      // 模拟进度条到50%
      const interval = setInterval(() => {
        if (autoAssignProgress.value < 50) {
          autoAssignProgress.value += 1
        }
      }, requestTimeout / 50)

      const response = await axios.post('/admin/autoassign', {}, { timeout: requestTimeout })
      clearInterval(interval)

      if (response.data.statusID === 0) {
        // 自动分配成功，进度条继续增加
        const remainingProgress = setInterval(() => {
          if (autoAssignProgress.value < 100) {
            autoAssignProgress.value += 2
          } else {
            clearInterval(remainingProgress)
          }
        }, 50)

        // 获取分配结果
        const resultsResponse = await axios.get('/admin/getAssignedReviewers')
        clearInterval(remainingProgress)

        if (resultsResponse.data.statusID === 0) {
          autoAssignResults.value = Object.entries(resultsResponse.data.data).map(([category, reviewers]) => ({
            category,
            assignedReviewers: reviewers.join(', ')
          }))
          autoAssignProgress.value = 100
          ElMessage.success('自动分配审核员完成')
          await fetchAssignedReviewers()
          await refreshCategoryTree()
        } else {
          throw new Error(resultsResponse.data.msg || '获取分配结果失败')
        }
      } else {
        throw new Error(response.data.msg || '自动分配失败')
      }
    } catch (error) {
      console.error('自动分配审核员失败:', error)
      if (retryCount < maxRetries) {
        retryCount++
        await runAutoAssign()
      } else {
        ElMessage.error('自动分配审核员失败，请稍后重试')
        autoAssignProgress.value = 0
      }
    } finally {
      autoAssigning.value = false
    }
  }

  await runAutoAssign()
}

// 格式化自动分配进度
const formatAutoAssignProgress = (percentage) => {
  if (percentage < 100) {
    return `${percentage.toFixed(0)}%`
  }
  return '完成'
}

// 处理页面大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 监听搜索查询变化
watch(searchQuery, debouncedSearch)

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

.el-row {
  flex-grow: 1;
  overflow: hidden;
}

.el-col {
  height: 100%;
}

.category-tree-card,
.user-permissions-card {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  flex-grow: 1;
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

.el-pagination {
  margin-top: 20px;
  padding: 10px 0;
}

@media (max-width: 768px) {
  .permission-management {
    padding: 10px;
    height: auto;
  }

  .el-col {
    height: auto;
    margin-bottom: 20px;
  }

  .category-tree-card,
  .user-permissions-card {
    height: auto;
  }

  .el-scrollbar {
    height: 50vh !important;
  }

  .card-header .el-input {
    width: 100%;
    margin-bottom: 10px;
  }

  .el-pagination {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>