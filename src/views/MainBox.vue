<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="menu-aside">
      <div class="logo">
        <img src="../assets/logo.png" alt="Logo" />
        <span v-if="!isCollapse">综合评价系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        @select="handleSelect"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="1">
          <el-icon><icon-menu /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><document /></el-icon>
          <template #title>申报填写</template>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><upload /></el-icon>
          <template #title>材料上传</template>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><search /></el-icon>
          <template #title>进度查询</template>
        </el-menu-item>
        <el-sub-menu index="5" v-if="isAdmin">
          <template #title>
            <el-icon><setting /></el-icon>
            <span>审核管理</span>
          </template>
          <el-menu-item index="5-1">待办事项</el-menu-item>
          <el-menu-item index="5-2">审核历史</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="6" v-if="isAdmin">
          <el-icon><setting /></el-icon>
          <template #title>权限管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <h2>{{ currentPageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleRoleChange" style="margin-right: 20px;">
            <span class="el-dropdown-link">
              切换权限 <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="admin">超级管理员</el-dropdown-item>
                <el-dropdown-item command="reviewer">审核员</el-dropdown-item>
                <el-dropdown-item command="user">普通用户</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              {{ userName }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Menu as IconMenu, Upload, Search, Setting, ArrowDown, Expand, Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const isAdmin = ref(false)
const isReviewer = ref(false)
const userName = ref('')
const userRole = ref('')

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const routeTitles = {
    '/': '首页',
    '/report': '申报填写',
    '/upload': '材料上传',
    '/state': '进度查询',
    '/admin/todo': '待办事项',
    '/admin/history': '审核历史',
    '/permission-management': '权限管理'
  }
  return routeTitles[route.path] || '综合评价信息申报系统'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleSelect = (key: string) => {
  switch (key) {
    case '1':
      router.push('/')
      break
    case '2':
      router.push('/report')
      break
    case '3':
      router.push('/upload')
      break
    case '4':
      router.push('/state')
      break
    case '5-1':
      router.push('/admin/todo')
      break
    case '5-2':
      router.push('/admin/history')
      break
    case '6':
      router.push('/permission-management')
      break
  }
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    router.push('/login')
    ElMessage.success('已成功退出登录')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

const handleRoleChange = (role: string) => {
  userRole.value = role
  localStorage.setItem('userRole', role)
  isAdmin.value = role === 'admin'
  isReviewer.value = role === 'reviewer'
  ElMessage.success(`已切换到${role === 'admin' ? '超级管理员' : role === 'reviewer' ? '审核员' : '普通用户'}权限`)
}

watch(userRole, (newRole) => {
  // 当用户角色变化时，可能需要重新加载某些组件或更新路由
  // 这里可以添加相应的逻辑
})

onMounted(() => {
  const storedRole = localStorage.getItem('userRole')
  userRole.value = storedRole || 'user'
  isAdmin.value = userRole.value === 'admin'
  isReviewer.value = userRole.value === 'reviewer'
  userName.value = localStorage.getItem('userName') || '未知用户'
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.menu-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  padding: 10px;
  overflow: hidden;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.logo span {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}

.main-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .menu-aside {
    position: absolute;
    z-index: 1;
    height: 100%;
  }

  .main-header {
    padding: 0 10px;
  }

  .header-left h2 {
    font-size: 18px;
  }
}
</style>