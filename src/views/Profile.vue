<template>
    <div class="profile">
      <h1>个人信息</h1>
      <el-card class="profile-card" v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-button class="button" text @click="editProfile">编辑</el-button>
          </div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="姓名">{{ userInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ userInfo.studentId }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ userInfo.class }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ userInfo.grade }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
  
      <el-dialog v-model="dialogVisible" title="编辑个人信息" width="50%">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="姓名">
            <el-input v-model="editForm.name" disabled></el-input>
          </el-form-item>
          <el-form-item label="学号">
            <el-input v-model="editForm.studentId" disabled></el-input>
          </el-form-item>
          <el-form-item label="班级">
            <el-input v-model="editForm.class" disabled></el-input>
          </el-form-item>
          <el-form-item label="年级">
            <el-input v-model="editForm.grade" disabled></el-input>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="editForm.email"></el-input>
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="editForm.phone"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveProfile">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const loading = ref(false)
  const dialogVisible = ref(false)
  
  const userInfo = reactive({
    name: '',
    studentId: '',
    class: '',
    grade: '',
    email: '',
    phone: ''
  })
  
  const editForm = reactive({ ...userInfo })
  
  onMounted(() => {
    fetchUserInfo()
  })
  
  const fetchUserInfo = async () => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      Object.assign(userInfo, {
        name: '张三',
        studentId: '202238000001',
        class: '软件工程1班',
        grade: '2022级',
        email: 'zhangsan@example.com',
        phone: '13800138000'
      })
  
      // 实际的API调用可能如下：
      // const response = await axios.get('/api/user-info', {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   Object.assign(userInfo, response.data.data)
      // } else {
      //   throw new Error(response.data.msg)
      // }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      ElMessage.error('获取用户信息失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }
  
  const editProfile = () => {
    Object.assign(editForm, userInfo)
    dialogVisible.value = true
  }
  
  const saveProfile = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      Object.assign(userInfo, editForm)
      ElMessage.success('个人信息更新成功')
      dialogVisible.value = false
  
      // 实际的API调用可能如下：
      // const response = await axios.post('/api/update-user-info', editForm, {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   Object.assign(userInfo, editForm)
      //   ElMessage.success('个人信息更新成功')
      //   dialogVisible.value = false
      // } else {
      //   throw new Error(response.data.msg)
      // }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      ElMessage.error('更新用户信息失败，请稍后重试')
    }
  }
  </script>
  
  <style scoped>
  .profile {
    padding: 20px;
  }
  
  .profile-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  @media (max-width: 768px) {
    .profile {
      padding: 10px;
    }
  }
  </style>