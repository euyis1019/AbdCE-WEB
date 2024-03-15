<template>
    <div class="demo-progress">
        <el-progress :percentage="20" />
    
    </div>
    <div class="centered-box">
      <div class="content-box">
        <el-button @click="open">您的综测材料已被审核，是否确认</el-button>
      </div>
    </div>
  </template>
  
      
  <script lang="ts" setup>
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  const open = () => {
    ElMessageBox.confirm(
      '确认后无法撤销',
      'Warning',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        ElMessage({
          type: 'success',
          message: '已确认',
        })
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '已取消',
        })
      })
  }
  </script>
  
  

  <style scoped>
  .centered-box {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  
  .content-box {
    background-color: #f8f8f8; 
    padding: 80px;
    border-radius: 8px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }
  </style>
  
  