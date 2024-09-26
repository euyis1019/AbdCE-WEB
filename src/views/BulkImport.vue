<template>
  <div class="bulk-import">
    <h1>批量导入</h1>

    <el-alert
      v-if="!hasPermission"
      title="您没有权限访问此页面"
      type="error"
      :closable="false"
      show-icon
    />

    <template v-else>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="upload-card">
            <template #header>
              <div class="card-header">
                <span>文件上传</span>
                <el-button type="primary" @click="downloadTemplate">下载模板</el-button>
              </div>
            </template>
            <el-upload
              class="upload-demo"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
              accept=".xlsx"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传 xlsx 文件
                </div>
              </template>
            </el-upload>
            <el-button type="success" @click="submitUpload" :disabled="!fileList.length">
              开始上传
            </el-button>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="category-tree-card">
            <template #header>
              <div class="card-header">
                <span>分类树状图</span>
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索分类或 caseID"
                  style="width: 200px;"
                  @input="handleSearch"
                >
                  <template #prefix>
                    <el-icon><search /></el-icon>
                  </template>
                </el-input>
              </div>
            </template>
            <el-tree
              ref="categoryTreeRef"
              :data="categoryTree"
              :props="defaultProps"
              :filter-node-method="filterNode"
              node-key="id"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.caseID">（caseID: {{ data.caseID }}）</span>
                </span>
              </template>
            </el-tree>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="result-card" v-if="uploadResult.length">
        <template #header>
          <div class="card-header">
            <span>上传结果</span>
          </div>
        </template>
        <el-table :data="uploadResult" style="width: 100%">
          <el-table-column prop="Case" label="Case ID" width="180" />
          <el-table-column prop="Name" label="姓名" width="180" />
          <el-table-column prop="ID" label="学号" width="180" />
          <el-table-column prop="processed" label="处理状态">
            <template #default="scope">
              <el-tag :type="scope.row.processed ? 'success' : 'danger'">
                {{ scope.row.processed ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Search } from '@element-plus/icons-vue'
import axios from '@/http-common'
import { useAuthStore } from '@/store/auth'

// 使用 auth store 来检查权限
const authStore = useAuthStore()
const hasPermission = computed(() => authStore.permissionLevel >= 30)

// 引用 category tree
const categoryTreeRef = ref(null)
// 分类树数据
const categoryTree = ref([])
// 搜索查询
const searchQuery = ref('')
// 文件列表
const fileList = ref([])
// 上传结果
const uploadResult = ref([])

// 树的默认属性
const defaultProps = {
  children: 'children',
  label: 'label',
}

// 组件挂载时获取分类树
onMounted(async () => {
  if (hasPermission.value) {
    await fetchCategoryTree()
  }
})

// 获取分类树数据
const fetchCategoryTree = async () => {
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryTree.value = convertTreeFormat(response.data.data)
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('获取分类树失败:', error)
    ElMessage.error('获取分类树失败，请稍后重试')
  }
}

// 转换树形格式
const convertTreeFormat = (tree, parentId = null) => {
  return Object.entries(tree).map(([key, value], index) => {
    const node = {
      id: parentId ? `${parentId}-${index}` : `${index}`,
      label: key,
      children: [],
    }

    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value) {
        node.caseID = value.caseID
      } else {
        node.children = convertTreeFormat(value, node.id)
      }
    }

    return node
  })
}

// 处理搜索
const handleSearch = (val) => {
  categoryTreeRef.value.filter(val)
}

// 过滤节点方法
const filterNode = (value, data) => {
  if (!value) return true
  const searchLower = value.toLowerCase()
  return (
    data.label.toLowerCase().includes(searchLower) ||
    (data.caseID && data.caseID.toString().includes(searchLower))
  )
}

// 处理文件变化
const handleFileChange = (file) => {
  fileList.value = [file]
}

// 提交上传
const submitUpload = async () => {
  if (!fileList.value.length) {
    ElMessage.warning('请先选择文件')
    return
  }

  const formData = new FormData()
  formData.append('file', fileList.value[0].raw)

  try {
    const response = await axios.post('/admin/parseUploadExcel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (Array.isArray(response.data)) {
      uploadResult.value = response.data
      ElMessage.success('文件解析成功')
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('文件解析失败:', error)
    ElMessage.error('文件解析失败，请重试')
  }
}

// 下载模板
const downloadTemplate = () => {
  const templateUrl = '/example/bulk-upload-example.xlsx'
  const link = document.createElement('a')
  link.href = templateUrl
  link.download = 'bulk-upload-template.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('模板下载已开始')
}
</script>

<style scoped>
.bulk-import {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-card,
.category-tree-card,
.result-card {
  margin-bottom: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.el-tree-node__content {
  height: auto;
  padding: 5px 0;
}
</style>