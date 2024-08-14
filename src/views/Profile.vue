<template>
  <div class="profile">
    <h1>个人信息</h1>
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
import authService from '../services/authService'; // 引入 authService

// 定义路由实例
const router = useRouter();
// 定义加载状态
const loading = ref(false);
// 定义修改密码对话框可见性
const passwordDialogVisible = ref(false);
// 定义修改密码表单引用
const passwordFormRef = ref(null);

// 定义用户信息接口
interface UserInfo {
  name: string;
  studentId: string;
  class: string;
  grade: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
}

// 定义用户信息
const userInfo = ref<UserInfo>({
  name: '',
  studentId: '',
  class: '',
  grade: '',
  email: '',
  phone: '',
  avatar: '',
  role: ''
});

// 定义背景图片
const backgroundImage = ref('');

// 定义修改密码表单数据
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 定义修改密码表单验证规则
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
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 获取用户信息的方法
const fetchUserInfo = async () => {
  loading.value = true;
  try {
    // 使用 authService 获取当前用户信息
    const user = authService.getCurrentUser();
    // 如果用户信息存在
    if (user) {
      // 设置用户信息
      userInfo.value = {
        name: user.Name,
        studentId: user.ID,
        class: user.Class,
        grade: user.Year, // 假设后端返回的用户信息包含年份信息
        email: user.email || '',
        phone: user.phone || '',
        avatar: '',
        role: user.Permission
      };
      // 根据角色设置背景图片
      setBackgroundImage(userInfo.value.role);
    } else {
      // 如果未找到用户信息，抛出错误
      throw new Error('未找到用户信息'); 
    }
  } catch (error) {
    // 处理获取用户信息失败的错误
    console.error('获取用户信息失败:', error);
    ElMessage.error('获取用户信息失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 设置背景图片的方法
const setBackgroundImage = (role) => {
  // 根据角色设置不同的背景图片
  switch (role) {
    case '3':
      backgroundImage.value = 'url(path_to_admin_background.jpg)';
      break;
    case '2':
    case '1':
      backgroundImage.value = 'url(path_to_reviewer_background.jpg)';
      break;
    default:
      backgroundImage.value = 'url(path_to_user_background.jpg)';
  }
};

// 获取角色标签类型的方法
const getRoleTagType = (role) => {
  // 根据角色返回不同的标签类型
  switch (role) {
    case '3':
      return 'danger';
    case '2':
    case '1':
      return 'warning';
    default:
      return 'success';
  }
};

// 获取角色名称的方法
const getRoleName = (role) => {
  // 根据角色返回不同的角色名称
  switch (role) {
    case '3':
      return '超级管理员';
    case '2':
      return '级委';
    case '1':
      return '班委';
    default:
      return '普通用户';
  }
};

// 修改密码的方法
const changePassword = () => {
  passwordDialogVisible.value = true;
};

// 提交密码修改的方法
const submitPasswordChange = async () => {
  // 如果修改密码表单引用不存在，则返回
  if (!passwordFormRef.value) return;

  try {
    // 验证修改密码表单
    await passwordFormRef.value.validate();

    // 这里应该调用后端API来更改密码
    // const response = await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    // if (response.success) {
    //   ElMessage.success('密码修改成功');
    //   passwordDialogVisible.value = false;
    // } else {
    //   throw new Error(response.message);
    // }
    // 显示密码修改成功的提示信息
    ElMessage.success('密码修改成功');
    // 关闭修改密码对话框
    passwordDialogVisible.value = false;
  } catch (error) {
    // 处理修改密码失败的错误
    console.error('修改密码失败:', error);
    ElMessage.error('修改密码失败，请重试');
  }
};

// 注销的方法
const logout = () => {
  // 显示确认对话框
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  // 如果用户确认退出登录
  }).then(() => {
    // 使用 authService 的 logout 方法注销
    authService.logout(); 
    // 跳转到登录页面
    router.push('/login'); 
    // 显示注销成功的提示信息
    ElMessage.success('已成功退出登录'); 
  }).catch(() => {
    // 用户取消退出登录
  });
};

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo(); 
});
</script>

<style scoped>
/* 样式保持不变 */
</style>