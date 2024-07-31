<template>
    <div class="permission-management">
      <h1 class="page-title">
        权限分配管理
        <el-tag :type="isAllAssigned ? 'success' : 'warning'" effect="dark">
          {{ isAllAssigned ? '全部已分配' : '存在未分配项目' }}
        </el-tag>
      </h1>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="8">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>选择分类</span>
                <el-input
                  v-model="filterText"
                  placeholder="输入关键字进行筛选"
                  clearable
                  prefix-icon="Search"
                ></el-input>
              </div>
            </template>
            <el-tree
              ref="tree"
              :data="categoryOptions"
              :props="defaultProps"
              :filter-node-method="filterNode"
              @node-click="handleNodeClick"
              highlight-current
              default-expand-all
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <el-tag v-if="data.reviewers && data.reviewers.length" size="small" type="success">
                    {{ data.reviewers.length }} 名审核员
                  </el-tag>
                </span>
              </template>
            </el-tree>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="16">
          <el-card v-if="selectedBranch" class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>分配任务</span>
              </div>
            </template>
            <el-form ref="form" :model="form" label-width="120px">
              <el-form-item label="选中项目">
                <el-tag type="info">{{ getCategoryPath(selectedBranch) }}</el-tag>
              </el-form-item>
              <el-form-item label="审核员" prop="reviewers">
                <el-select
                  v-model="form.reviewers"
                  multiple
                  filterable
                  placeholder="选择审核员"
                  style="width: 100%"
                >
                  <el-option
                    v-for="reviewer in filteredReviewers()"
                    :key="reviewer.id"
                    :label="reviewer.name"
                    :value="reviewer.id"
                  >
                    <span style="float: left">{{ reviewer.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">
                      {{ reviewer.department }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitForm">提交</el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          <el-empty v-else description="请在左侧选择一个分支"></el-empty>
        </el-col>
      </el-row>
  
      <el-row :gutter="20" class="mt-4">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            <el-button @click="filterUnassigned">筛选未分配条目</el-button>
            <el-button @click="showReviewerItems">查看审核员负责条目</el-button>
            <el-button @click="showItemAssignment">查看条目分配情况</el-button>
            <el-button type="primary" @click="randomAssign">一键随机分配</el-button>
          </el-card>
        </el-col>
      </el-row>
  
      <el-dialog v-model="showAlert" title="操作成功" width="30%">
        <el-alert
          title="权限数据已成功提交!"
          type="success"
          :closable="false"
          show-icon
        ></el-alert>
        <template #footer>
          <span class="dialog-footer">
            <el-button type="primary" @click="showAlert = false">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Search } from '@element-plus/icons-vue'
  
  interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    reviewers?: string[];
  }
  
  interface Reviewer {
    id: string;
    name: string;
    department: string;
  }
  
  const tree = ref(null)
  const filterText = ref('')
  const showAlert = ref(false)
  const selectedBranch = ref<TreeNode | null>(null)
  
  const categoryOptions = ref<TreeNode[]>([
    {
      id: '1',
      label: '思想品德',
      children: [
        {
          id: '1-1',
          label: '思想政治',
          children: [
            { id: '1-1-1', label: '政治学习', reviewers: [] },
            { id: '1-1-2', label: '社会实践', reviewers: [] },
          ],
        },
        {
          id: '1-2',
          label: '道德品质',
          children: [
            { id: '1-2-1', label: '日常行为', reviewers: [] },
            { id: '1-2-2', label: '志愿服务', reviewers: [] },
          ],
        },
      ],
    },
    // ... 其他分类
  ])
  
  const reviewers = ref<Reviewer[]>([
    { id: '1', name: '审核员A', department: ' 1 班' },
    { id: '2', name: '审核员B', department: ' 2 班' },
    { id: '3', name: '审核员C', department: ' 3 班' },
    { id: '4', name: '审核员D', department: ' 4 班' },
  ])
  
  const defaultProps = {
    children: 'children',
    label: 'label',
  }
  
  const form = reactive({
    reviewers: [],
  })
  
  const isAllAssigned = computed(() => {
    return getAllBranches().every(branch => branch.reviewers && branch.reviewers.length > 0)
  })
  
  const handleNodeClick = (data: TreeNode) => {
    if (!data.children) {
      selectedBranch.value = data
      form.reviewers = data.reviewers || []
    }
  }
  
  const getCategoryPath = (branch: TreeNode | null): string => {
    if (!branch) return ''
  
    const path: string[] = []
    let current: TreeNode | undefined = branch
    while (current) {
      path.unshift(current.label)
      current = findParentNode(categoryOptions.value, current)
    }
  
    return path.join(' > ')
  }
  
  const findParentNode = (nodes: TreeNode[], target: TreeNode): TreeNode | undefined => {
    for (const node of nodes) {
      if (node.children?.includes(target)) {
        return node
      }
      if (node.children) {
        const found = findParentNode(node.children, target)
        if (found) return found
      }
    }
    return undefined
  }
  
  const filterNode = (value: string, data: TreeNode) => {
    if (!value) return true
    return data.label.includes(value)
  }
  
  watch(filterText, (val) => {
    if (tree.value) {
      tree.value.filter(val)
    }
  })
  
  const submitForm = async () => {
    if (!selectedBranch.value) return
  
    try {
      // 在实际应用中，这里应该调用API来更新审核员分配
      selectedBranch.value.reviewers = form.reviewers
      await nextTick()
      showAlert.value = true
      ElMessage.success('审核员分配已更新')
    } catch (error) {
      console.error('更新审核员分配失败:', error)
      ElMessage.error('更新失败，请重试')
    }
  }
  
  const resetForm = () => {
    form.reviewers = selectedBranch.value?.reviewers || []
  }
  
  const filteredReviewers = () => {
    return reviewers.value.filter(r => {
      return !selectedBranch.value?.reviewers?.includes(r.id)
    })
  }
  
  const filterUnassigned = () => {
    filterText.value = ''
    tree.value?.filter((data: TreeNode) => {
      return !data.reviewers || data.reviewers.length === 0
    })
  }
  
  const showReviewerItems = async () => {
    const reviewer = await ElMessageBox.prompt('请输入审核员ID', '查看审核员负责条目')
    if (reviewer.action === 'confirm') {
      filterText.value = ''
      tree.value?.filter((data: TreeNode) => {
        return data.reviewers?.includes(reviewer.value)
      })
    }
  }
  
  const showItemAssignment = async () => {
    const itemId = await ElMessageBox.prompt('请输入条目ID', '查看条目分配情况')
    if (itemId.action === 'confirm') {
      const item = findItemById(categoryOptions.value, itemId.value)
      if (item) {
        selectedBranch.value = item
        ElMessage.info(`条目 "${item.label}" 的审核员: ${item.reviewers?.join(', ') || '未分配'}`)
      } else {
        ElMessage.warning('未找到指定条目')
      }
    }
  }
  
  const findItemById = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findItemById(node.children, id)
        if (found) return found
      }
    }
    return null
  }
  
  const getAllBranches = (): TreeNode[] => {
    const branches: TreeNode[] = []
    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.children) {
          traverse(node.children)
        } else {
          branches.push(node)
        }
      }
    }
    traverse(categoryOptions.value)
    return branches
  }
  
  const randomAssign = () => {
    const branches = getAllBranches()
    branches.forEach(branch => {
      branch.reviewers = [
        reviewers.value[Math.floor(Math.random() * reviewers.value.length)].id,
        reviewers.value[Math.floor(Math.random() * reviewers.value.length)].id
      ]
    })
    ElMessage.success('已完成随机分配')
  }
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
  
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
  }
  
  .mt-4 {
    margin-top: 1rem;
  }
  
  @media (max-width: 768px) {
    .permission-management {
      padding: 10px;
    }
  
    .el-form-item {
      margin-bottom: 15px;
    }
  
    .el-button {
      margin-bottom: 10px;
      width: 100%;
    }
  }
  </style>
  