<template>
    <el-container class="layout-container">
      <el-aside width="200px" class="menu-aside">
        <div class="logo">
          <img src="../assets/logo.png" alt="Logo" />
          <span>综合评价系统</span>
        </div>
        <el-menu
          default-active="1"
          class="el-menu-vertical"
          @select="handleSelect"
          :collapse="isCollapse"
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
            <el-switch
              v-model="isAdmin"
              active-text="管理员"
              inactive-text="学生"
              @change="handleRoleChange"
            />
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
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Document, Menu as IconMenu, Upload, Search, Setting, ArrowDown } from '@element-plus/icons-vue'
  
  const router = useRouter()
  const isCollapse = ref(false)
  const isAdmin = ref(false)
  const userName = ref('张三') // 这里应该从用户认证状态获取
  
  const currentPageTitle = computed(() => {
    // 根据当前路由返回对应的页面标题
    return '综合评价信息申报系统'
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
    }
  }
  
  const handleCommand = (command: string) => {
    if (command === 'logout') {
      localStorage.removeItem('token')
      router.push('/login')
      ElMessage.success('已成功退出登录')
    } else if (command === 'profile') {
      router.push('/profile')
    }
  }
  
  const handleRoleChange = (value: boolean) => {
    localStorage.setItem('userRole', value ? 'admin' : 'student')
    ElMessage.success(`已切换为${value ? '管理员' : '学生'}角色`)
  }
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
  
  .header-right .el-switch {
    margin-right: 20px;
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
  </style>