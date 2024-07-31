<template>
    <div class="permission-management">
      <h1>权限分配管理</h1>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="filterText"
            placeholder="输入关键字进行筛选"
          ></el-input>
          <el-tree
            ref="tree"
            :data="treeData"
            :props="defaultProps"
            :filter-node-method="filterNode"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span>{{ node.label }}</span>
              <span v-if="data.reviewers && data.reviewers.length">
                ({{ data.reviewers.length }} 名审核员)
              </span>
            </template>
          </el-tree>
        </el-col>
        <el-col :span="16">
          <el-form v-if="selectedItem" :model="selectedItem" label-width="120px">
            <el-form-item label="选中项目">
              {{ getFullPath(selectedItem) }}
            </el-form-item>
            <el-form-item label="审核员">
              <el-select
                v-model="selectedItem.reviewers"
                multiple
                filterable
                placeholder="选择审核员"
                @change="updateReviewers"
              >
                <el-option
                  v-for="reviewer in reviewers"
                  :key="reviewer.id"
                  :label="reviewer.name"
                  :value="reviewer.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <el-empty v-else description="请选择一个条目"></el-empty>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <h2>筛选功能</h2>
          <el-button @click="filterUnassigned">筛选未分配条目</el-button>
          <el-button @click="showReviewerItems">查看审核员负责条目</el-button>
          <el-button @click="showItemAssignment">查看条目分配情况</el-button>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    reviewers?: string[];
  }
  
  interface Reviewer {
    id: string;
    name: string;
  }
  
  const treeData = ref<TreeNode[]>([])
  const reviewers = ref<Reviewer[]>([])
  const selectedItem = ref<TreeNode | null>(null)
  const filterText = ref('')
  const tree = ref(null)
  
  const defaultProps = {
    children: 'children',
    label: 'label',
  }
  
  onMounted(async () => {
    // 模拟从后端获取数据
    treeData.value = [
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
      // ... 其他一级分类
    ]
  
    reviewers.value = [
      { id: '1', name: '审核员A' },
      { id: '2', name: '审核员B' },
      { id: '3', name: '审核员C' },
      // ... 其他审核员
    ]
  })
  
  const handleNodeClick = (data: TreeNode) => {
    selectedItem.value = data
    if (!selectedItem.value.reviewers) {
      selectedItem.value.reviewers = []
    }
  }
  
  const updateReviewers = async () => {
    if (!selectedItem.value) return
  
    // 这里应该调用后端 API 更新审核员分配
    console.log(`更新条目 ${selectedItem.value.id} 的审核员: ${selectedItem.value.reviewers?.join(', ')}`)
    ElMessage.success('更新成功')
  }
  
  const getFullPath = (node: TreeNode | null): string => {
    if (!node) return ''
  
    const path: string[] = []
    let current: TreeNode | undefined = node
  
    while (current) {
      path.unshift(current.label)
      current = findParentNode(treeData.value, current)
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
      (tree.value as any).filter(val)
    }
  })
  
  const filterUnassigned = () => {
    filterText.value = ''
    if (tree.value) {
      (tree.value as any).filter((data: TreeNode) => {
        return !data.reviewers || data.reviewers.length === 0
      })
    }
  }
  
  const showReviewerItems = async () => {
    const reviewerId = await ElMessageBox.prompt('请输入审核员ID', '查看审核员负责条目')
    if (reviewerId.action === 'confirm') {
      filterText.value = ''
      if (tree.value) {
        (tree.value as any).filter((data: TreeNode) => {
          return data.reviewers?.includes(reviewerId.value)
        })
      }
    }
  }
  
  const showItemAssignment = async () => {
    const itemId = await ElMessageBox.prompt('请输入条目ID', '查看条目分配情况')
    if (itemId.action === 'confirm') {
      const item = findItemById(treeData.value, itemId.value)
      if (item) {
        selectedItem.value = item
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
  </script>
  
  <style scoped>
  .permission-management {
    padding: 20px;
  }
  
  .el-tree {
    margin-top: 20px;
  }
  
  h2 {
    margin-top: 20px;
  }
  
  .el-button {
    margin-right: 10px;
    margin-bottom: 10px;
  }
  </style>