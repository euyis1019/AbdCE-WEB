<template>
    <div class="upload">
      <h1>材料上传</h1>
      <el-upload
        class="upload-demo"
        drag
        action="/api/upload"
        :on-preview="handlePreview"
        :on-remove="handleRemove"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :file-list="fileList"
        multiple
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 jpg/png/pdf 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>
  
      <el-table :data="uploadedFiles" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="name" label="文件名" width="180"></el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '上传成功' : '上传失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleDownload(scope.row)" :disabled="scope.row.status !== 'success'">下载</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  
  const fileList = ref([])
  const uploadedFiles = ref([])
  
  const handlePreview = (file) => {
    console.log(file)
  }
  
  const handleRemove = (file, fileList) => {
    console.log(file, fileList)
  }
  
  const handleUploadSuccess = (response, file, fileList) => {
    ElMessage.success(`${file.name} 上传成功`)
    uploadedFiles.value.push({
      name: file.name,
      size: file.size,
      status: 'success',
      url: response.url // 假设服务器返回了文件的URL
    })
  }
  
  const handleUploadError = (err, file, fileList) => {
    ElMessage.error(`${file.name} 上传失败`)
    uploadedFiles.value.push({
      name: file.name,
      size: file.size,
      status: 'error'
    })
  }
  
  const beforeUpload = (file) => {
    const isJPG = file.type === 'image/jpeg'
    const isPNG = file.type === 'image/png'
    const isPDF = file.type === 'application/pdf'
    const isLt10M = file.size / 1024 / 1024 < 10
  
    if (!isJPG && !isPNG && !isPDF) {
      ElMessage.error('上传文件只能是 JPG/PNG/PDF 格式!')
    }
    if (!isLt10M) {
      ElMessage.error('上传文件大小不能超过 10MB!')
    }
    return (isJPG || isPNG || isPDF) && isLt10M
  }
  
  const handleDownload = (file) => {
    // 实现下载逻辑，可能需要调用后端API
    window.open(file.url, '_blank')
  }
  
  const handleDelete = (index, row) => {
    // 实现删除逻辑，可能需要调用后端API
    uploadedFiles.value.splice(index, 1)
    ElMessage.success(`${row.name} 已删除`)
  }
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  </script>
  
  <style scoped>
  .upload {
    padding: 20px;
  }
  
  .upload-demo {
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .upload {
      padding: 10px;
    }
  }
  </style>