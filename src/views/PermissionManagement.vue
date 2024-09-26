<template>
  <div class="permission-management">
    <h1 class="page-title">权限与审核员分配管理</h1>

    <el-card class="category-card">
      <template #header>
        <div class="card-header">
          <h2>类别审核员分配</h2>
          <div class="header-actions">
            <el-button type="primary" @click="autoAssignReviewers" :loading="autoAssigning">自动分配审核员</el-button>
            <el-button @click="refreshCategoryList">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="categoryList" style="width: 100%" v-loading="loading.category">
        <el-table-column prop="categoryName" label="类别名称" width="180" />
        <el-table-column prop="caseID" label="类别ID" width="120" />
        <el-table-column label="审核员分配">
          <template #default="{ row }">
            <el-popover
              v-for="grade in getAvailableGradesForCategory(row.caseID)"
              :key="grade"
              trigger="click"
              :width="300"
            >
              <template #reference>
                <el-tag 
                  :type="getGradeTagType(row.caseID, grade)"
                  style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;"
                >
                  {{ grade }}级
                  <el-badge 
                    :value="getReviewersCount(row.caseID, grade)" 
                    :max="99"
                    class="reviewer-count-badge"
                  />
                </el-tag>
              </template>
              <div class="reviewer-list">
                <div v-for="reviewer in getReviewers(row.caseID, grade)" :key="reviewer.userID" class="reviewer-item">
                  <span>{{ getReviewerDisplayName(reviewer) }} - {{ getReviewerLevelLabel(reviewer.level) }}</span>
                  <el-button 
                    type="danger" 
                    size="small" 
                    icon="Delete" 
                    circle
                    @click="showRemoveConfirmDialog(row, reviewer, grade)"
                  />
                </div>
                <el-button 
                  v-if="getReviewers(row.caseID, grade).length < 2" 
                  size="small" 
                  @click="showAssignDialog(row, grade)"
                >
                  分配审核员
                </el-button>
              </div>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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
      <el-table :data="paginatedUserPermissions" style="width: 100%" v-loading="loading.userPermissions">
        <el-table-column prop="userID" label="用户ID" width="120" />
        <el-table-column prop="name" label="用户姓名" width="120" v-if="hasNameField" />
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
              <el-option label="普通用户" :value="0" />
              <el-option label="审核员" :value="10" />
              <el-option label="管理员" :value="20" />
              <el-option label="超级管理员" :value="30" />
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
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredUserPermissions.length"
        />
      </div>
    </el-card>

    <el-dialog v-model="assignDialogVisible" title="分配审核员" width="30%">
  <el-form :model="assignForm" label-width="100px">
    <el-form-item label="类别">
      {{ assignForm.categoryName }}
    </el-form-item>
    <el-form-item label="年级">
      {{ assignForm.grade }}级
    </el-form-item>
    <el-form-item label="审核员">
      <el-select v-model="assignForm.reviewerId" placeholder="请选择审核员">
        <el-option
          v-for="reviewer in availableReviewers"
          :key="reviewer.userID"
          :label="reviewer.name || reviewer.userID"
          :value="reviewer.userID"
        >
          <span>{{ reviewer.name || reviewer.userID }}</span>
          <span style="float: right; color: #8492a6; font-size: 13px">
            {{ getReviewerLevelLabel(reviewer.level) }}
          </span>
        </el-option>
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

    <!-- 确认移除审核员对话框 -->
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

    <!-- 自动分配审核员对话框 -->
    <el-dialog
      v-model="autoAssignDialogVisible"
      title="自动分配审核员"
      width="50%"
    >
      <el-progress
        v-if="autoAssigning"
        :percentage="autoAssignProgress"
        :format="formatAutoAssignProgress"
      />
      <div v-else>
        <h3>分配结果</h3>
        <el-table :data="autoAssignResults" style="width: 100%">
          <el-table-column prop="category" label="大类" />
          <el-table-column prop="assignedReviewers" label="分配的审核员" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import axios from '../http-common'
import authService from '../services/authService'
import { debounce } from 'lodash'

// 状态变量
const loading = ref({
  category: false,
  userPermissions: false
})
const categoryList = ref([])
const availableGrades = ref([])
const assignedReviewers = ref({})
const userPermissions = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框控制
const assignDialogVisible = ref(false)
const removeConfirmDialogVisible = ref(false)
const autoAssignDialogVisible = ref(false)

// 表单数据
const assignForm = ref({
  categoryId: '',
  categoryName: '',
  reviewerId: '',
  grade: ''
})

// 自动分配相关
const autoAssigning = ref(false)
const autoAssignProgress = ref(0)
const autoAssignResults = ref([])

// 要移除的审核员信息
const reviewerToRemove = ref(null)
const categoryToUpdate = ref(null)
const gradeToRemove = ref('')

// 计算属性
const hasNameField = computed(() => userPermissions.value.some(user => 'name' in user))

const filteredUserPermissions = computed(() => {
  if (!searchQuery.value) return userPermissions.value
  const query = searchQuery.value.toLowerCase()
  return userPermissions.value.filter(user => 
    Object.values(user).some(value => 
      String(value).toLowerCase().includes(query)
    )
  )
})

const paginatedUserPermissions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredUserPermissions.value.slice(startIndex, endIndex)
})

// FIXME: 暂时获取不到审核员，待排查修复
const availableReviewers = computed(() => {
  return userPermissions.value.filter(user => user.level > 0 && user.level < 30)
})

const fetchUserPermissions = async () => {
  loading.value.userPermissions = true
  try {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('用户未登录')

    const response = await axios.get('/admin/adminlevel', {
      params: { userID: user.StudentId }
    })

    if (response.data.message === "Administrators retrieved successfully") {
      userPermissions.value = Object.entries(response.data.groupedAdmins)
        .filter(([level]) => parseInt(level) > 0)
        .flatMap(([level, users]) =>
          users.map(user => ({
            userID: user.userID.toString(),
            name: user.name || '',
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
  } finally {
    loading.value.userPermissions = false
  }
}

const fetchCategoryList = async () => {
  loading.value.category = true
  try {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('用户未登录')

    const response = await axios.get('/case/categorytree', {
      params: { userID: user.StudentId }
    })

    if (response.data.statusID === 0) {
      categoryList.value = parseCategories(response.data.data)
    } else {
      throw new Error(response.data.msg || '获取类别列表失败')
    }
  } catch (error) {
    console.error('获取类别列表失败:', error)
    ElMessage.error('获取类别列表失败，请稍后重试')
  } finally {
    loading.value.category = false
  }
}

const parseCategories = (data, parentPath = []) => {
  let categories = []
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value) {
        categories.push({
          categoryName: [...parentPath, key].filter(k => k !== 'undefined').join(' > '),
          caseID: value.caseID.toString(),
          topPoint: value.topPoint || '0'
        })
      } else {
        categories = categories.concat(parseCategories(value, [...parentPath, key]))
      }
    }
  }
  return categories
}

const fetchAssignedReviewers = async () => {
  try {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('用户未登录')

    const response = await axios.get('/admin/getAssignedReviewers', {
      params: { userID: user.StudentId }
    })

    if (Array.isArray(response.data)) {
      assignedReviewers.value = response.data.reduce((acc, item) => {
        acc[item.caseID] = item.reviewList
        return acc
      }, {})

      // 更新可用年级列表，只包含有分配审核员的年级
      availableGrades.value = Array.from(
        new Set(
          response.data.flatMap(item => 
            Object.entries(item.reviewList)
              .filter(([grade, reviewers]) => reviewers.length > 0)
              .map(([grade]) => grade)
          )
        )
      ).sort((a, b) => parseInt(b) - parseInt(a))
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('获取已分配审核员失败:', error)
    ElMessage.error('获取已分配审核员失败，请稍后重试')
  }
}

const getReviewers = (caseID, grade) => {
  if (assignedReviewers.value[caseID] && assignedReviewers.value[caseID][grade]) {
    return assignedReviewers.value[caseID][grade].map(id => {
      const user = userPermissions.value.find(u => u.userID === id.toString())
      return user ? {
        userID: user.userID,
        name: user.name || 'Unknown',
        level: user.level
      } : null
    }).filter(Boolean)
  }
  return []
}

const getGradeTagType = (caseID, grade) => {
  const reviewers = getReviewers(caseID, grade)
  if (reviewers.length === 0) return 'info'
  if (reviewers.length === 1) return 'warning'
  return 'success'
}

const getReviewerDisplayName = (reviewer) => {
  return reviewer.name || reviewer.userID
}

const getReviewerLevelLabel = (level) => {
  switch (level) {
    case 10: return '审核员'
    case 20: return '管理员'
    case 30: return '超级管理员'
    default: return '普通用户'
  }
}

const showAssignDialog = (category, grade) => {
  assignForm.value = {
    categoryId: category.caseID,
    categoryName: category.categoryName,
    reviewerId: '',
    grade: grade
  }
  assignDialogVisible.value = true
}

const assignReviewer = async () => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) throw new Error('用户未登录')

    const response = await axios.post('/admin/assignTask', {
      adminID: currentUser.StudentId,
      reviewerID: assignForm.value.reviewerId,
      categoryCodes: [assignForm.value.categoryId],
      grade: assignForm.value.grade
    })

    if (response.data.statusID === 0) {
      ElMessage.success('审核员分配成功')
      assignDialogVisible.value = false
      await fetchAssignedReviewers()
    } else {
      throw new Error(response.data.msg || '分配审核员失败')
    }
  } catch (error) {
    console.error('分配审核员失败:', error)
    ElMessage.error('分配审核员失败，请稍后重试')
  }
}

const showRemoveConfirmDialog = (category, reviewer, grade) => {
  reviewerToRemove.value = reviewer
  categoryToUpdate.value = category
  gradeToRemove.value = grade
  removeConfirmDialogVisible.value = true
}

const confirmRemoveReviewer = async () => {
  removeConfirmDialogVisible.value = false
  if (reviewerToRemove.value && categoryToUpdate.value) {
    await removeReviewer(categoryToUpdate.value, reviewerToRemove.value, gradeToRemove.value)
  }
}

const removeReviewer = async (category, reviewer, grade) => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) throw new Error('用户未登录')

    const response = await axios.post('/admin/updateReviewerStatus', {
      userID: reviewer.userID,
      reviewer: false,
      categoryCode: category.caseID,
      grade: grade
    })

    if (response.data.statusID === 0) {
      ElMessage.success('审核员移除成功')
      await fetchAssignedReviewers()
    } else {
      throw new Error(response.data.msg || '移除审核员失败')
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
    if (!currentUser) throw new Error('用户未登录')

    const response = await axios.post('/admin/updateadmin', {
      userID: currentUser.StudentId,
      updateuserID: user.userID,
      level: user.newLevel
    })

    if (response.data.statusID === 0) {
      ElMessage.success('用户权限更新成功')
      user.level = user.newLevel
      await fetchUserPermissions()
    } else {
      throw new Error(response.data.msg || '更新用户权限失败')
    }
  } catch (error) {
    console.error('更新用户权限失败:', error)
    ElMessage.error('更新用户权限失败，请稍后重试')
  }
}

const refreshCategoryList = async () => {
  await fetchCategoryList()
  await fetchAssignedReviewers()
}

const refreshUserPermissions = async () => {
  await fetchUserPermissions()
}

const autoAssignReviewers = async () => {
  autoAssigning.value = true
  autoAssignDialogVisible.value = true
  autoAssignProgress.value = 0
  autoAssignResults.value = []

  try {
    const response = await axios.post('/admin/autoassign', {})
    if (response.data.statusID === 0) {
      // 模拟进度条
      const interval = setInterval(() => {
        if (autoAssignProgress.value < 100) {
          autoAssignProgress.value += 10
        } else {
          clearInterval(interval)
        }
      }, 200)

      // 获取分配结果
      const resultsResponse = await axios.get('/admin/getAssignedReviewers')
      clearInterval(interval)

      if (resultsResponse.data.statusID === 0) {
        autoAssignResults.value = Object.entries(resultsResponse.data.data).map(([category, reviewers]) => ({
          category,
          assignedReviewers: reviewers.join(', ')
        }))
        autoAssignProgress.value = 100
        ElMessage.success('自动分配审核员完成')
        await fetchAssignedReviewers()
      } else {
        throw new Error(resultsResponse.data.msg || '获取分配结果失败')
      }
    } else {
      throw new Error(response.data.msg || '自动分配失败')
    }
  } catch (error) {
    console.error('自动分配审核员失败:', error)
    ElMessage.error('自动分配审核员失败，请稍后重试')
    autoAssignProgress.value = 0
  } finally {
    autoAssigning.value = false
  }
}

const formatAutoAssignProgress = (percentage) => {
  if (percentage < 100) {
    return `${percentage.toFixed(0)}%`
  }
  return '完成'
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
}, 300)

// 新增的方法
const getAvailableGradesForCategory = (caseID) => {
  if (assignedReviewers.value[caseID]) {
    return Object.entries(assignedReviewers.value[caseID])
      .filter(([grade, reviewers]) => reviewers.length > 0)
      .map(([grade]) => grade)
      .sort((a, b) => parseInt(b) - parseInt(a));
  }
  return [];
}

const getReviewersCount = (caseID, grade) => {
  if (assignedReviewers.value[caseID] && assignedReviewers.value[caseID][grade]) {
    return assignedReviewers.value[caseID][grade].length;
  }
  return 0;
}

// 生命周期钩子
onMounted(async () => {
  await fetchUserPermissions()
  await fetchCategoryList()
  await fetchAssignedReviewers()
})

// 监听搜索查询变化
watch(searchQuery, debouncedSearch)
</script>

<style scoped>
.permission-management {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.category-card,
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

.reviewer-list {
  max-height: 200px;
  overflow-y: auto;
}

.reviewer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.reviewer-count-badge {
  margin-left: 5px;
}

.el-badge__content {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
}

@media (max-width: 768px) {
  .permission-management {
    padding: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header .el-input {
    margin-top: 10px;
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
  }

  .header-actions .el-button {
    width: 100%;
    margin-bottom: 10px;
  }

  .el-table {
    font-size: 12px;
  }

  .pagination-container {
    justify-content: center;
  }
}
</style>