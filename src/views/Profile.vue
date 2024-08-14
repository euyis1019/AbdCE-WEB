<template>
    <div class="profile">
      <h1>个人信息（未完成）</h1>
      <el-card class="profile-card" :style="{ backgroundImage: `url(${backgroundImage})` }" shadow="hover" v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <div class="profile-content">
          <el-avatar :size="100" :src="userInfo.avatar">{{ userInfo.name?.charAt(0) }}</el-avatar>
          <el-descriptions class="user-info" :column="1" border>
            <el-descriptions-item label="姓名">{{ userInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ userInfo.studentId }}</el-descriptions-item>
            <el-descriptions-item label="班级">{{ userInfo.class }}</el-descriptions-item>
            <el-descriptions-item label="年级">{{ userInfo.grade }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="getRoleTagType(userInfo.role)">{{ getRoleName(userInfo.role) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
      <el-card class="actions-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>操作</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button type="primary" @click="changePassword">修改密码</el-button>
          <el-button type="danger" @click="logout">退出登录</el-button>
        </div>
      </el-card>
    </div>
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="30%">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPasswordChange">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </template>
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  const router = useRouter()
  const loading = ref(false)
  const passwordDialogVisible = ref(false)
  const passwordFormRef = ref(null)
  
  const userInfo = ref({
    name: '',
    studentId: '',
    class: '',
    grade: '',
    email: '',
    phone: '',
    avatar: '',
    role: ''
  })
  
  const backgroundImage = ref('')
  
  const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const passwordRules = {
    currentPassword: [
      { required: true, message: '请输入当前密码', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== passwordForm.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
  
  const fetchUserInfo = async () => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      userInfo.value = {
        name: '张三',
        studentId: '20223800001',
        class: '软件工程2班',
        grade: '2022级',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        avatar: '',
        role: 'user'
      }
  
      // 根据角色设置背景图片
      setBackgroundImage(userInfo.value.role)
  
      // 实际的API调用可能如下：
      // const response = await axios.get('/api/user-info', {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   userInfo.value = response.data.data
      //   setBackgroundImage(userInfo.value.role)
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
  
  const setBackgroundImage = (role) => {
    switch (role) {
      case 'admin':
        backgroundImage.value = 'url(path_to_admin_background.jpg)'
        break
      case 'reviewer':
        backgroundImage.value = 'url(path_to_reviewer_background.jpg)'
        break
      default:
        backgroundImage.value = 'url(path_to_user_background.jpg)'
    }
  }
  
  const getRoleTagType = (role) => {
    switch (role) {
      case 'admin':
        return 'danger'
      case 'reviewer':
        return 'warning'
      default:
        return 'success'
    }
  }
  
  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return '超级管理员'
      case 'reviewer':
        return '审核员'
      default:
        return '普通用户'
    }
  }
  
  const changePassword = () => {
    passwordDialogVisible.value = true
  }
  
  const submitPasswordChange = async () => {
    if (!passwordFormRef.value) return
    
    try {
      await passwordFormRef.value.validate()
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 实际的API调用可能如下：
      // const response = await axios.post('/api/change-password', passwordForm, {
      //   params: {
      //     t: localStorage.getItem('token'),
      //     ID: localStorage.getItem('ID')
      //   }
      // })
      // if (response.data.statusID === 0) {
      //   ElMessage.success('密码修改成功')
      //   passwordDialogVisible.value = false
      // } else {
      //   throw new Error(response.data.msg)
      // }
  
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    } catch (error) {
      console.error('修改密码失败:', error)
      ElMessage.error('修改密码失败，请重试')
    }
  }
  
  const logout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userName')
      router.push('/login')
      ElMessage.success('已成功退出登录')
    }).catch(() => {
      // 取消退出登录
    })
  }
  
  onMounted(() => {
    fetchUserInfo()
  })
  </script>
  <style scoped>
  .profile {
    padding: 20px;
  }
  
  .profile-card {
    margin-bottom: 20px;
    background-size: cover;
    background-position: center;
  }
  
  .actions-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .profile-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
  }
  
  .el-avatar {
    margin-bottom: 20px;
  }
  
  .user-info {
    width: 100%;
  }
  
  .action-buttons {
    display: flex;
    justify-content: space-around;
  }
  
  @media (max-width: 768px) {
    .profile {
      padding: 10px;
    }
  
    .action-buttons {
      flex-direction: column;
    }
  
    .action-buttons .el-button {
      margin-bottom: 10px;
    }
  }
  </style>