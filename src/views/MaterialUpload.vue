<template>
    <div class="material-upload">
      <h1>材料上传</h1>
      <el-upload
        class="upload-demo"
        drag
        action="/api/upload"
        multiple
        :on-preview="handlePreview"
        :on-remove="handleRemove"
        :on-success="handleSuccess"
        :before-upload="beforeUpload"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传jpg/png/pdf文件，单个文件不超过5MB
          </div>
        </template>
      </el-upload>
  
      <el-table :data="uploadedFiles" style="width: 100%">
        <el-table-column prop="name" label="文件名" width="180">
        </el-table-column>
        <el-table-column prop="size" label="大小" width="180">
          <template #default="scope">
            {{ (scope.row.size / 1024 / 1024).toFixed(2) }} MB
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '上传成功' : '上传失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
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
  
  const handleSuccess = (response, file, fileList) => {
    ElMessage.success(`${file.name} 上传成功`)
    uploadedFiles.value.push({
      name: file.name,
      size: file.size,
      status: 'success'
    })
  }
  
  const beforeUpload = (file) => {
    const isJPG = file.type === 'image/jpeg'
    const isPNG = file.type === 'image/png'
    const isPDF = file.type === 'application/pdf'
    const isLt5M = file.size / 1024 / 1024 < 5
  
    if (!isJPG && !isPNG && !isPDF) {
      ElMessage.error('上传文件只能是 JPG/PNG/PDF 格式!')
    }
    if (!isLt5M) {
      ElMessage.error('上传文件大小不能超过 5MB!')
    }
    return (isJPG || isPNG || isPDF) && isLt5M
  }
  
  const handleDelete = (index, row) => {
    uploadedFiles.value.splice(index, 1)
    ElMessage.success(`${row.name} 已删除`)
  }
  </script>
  
  <style scoped>
  .material-upload {
    padding: 20px;
  }
  
  .upload-demo {
    margin-bottom: 20px;
  }
  </style>