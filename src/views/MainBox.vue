<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="menu-aside" v-if="!isMobile">
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
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><EditPen /></el-icon>
          <template #title>申报填写</template>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><InfoFilled /></el-icon>
          <template #title>进度查询</template>
        </el-menu-item>
        <el-menu-item index="4" v-if="isReviewer || isAdmin">
          <el-icon><Document /></el-icon>
          <template #title>待办事项</template>
        </el-menu-item>
        <el-menu-item index="5" v-if="isAdmin">
          <el-icon><Setting /></el-icon>
          <template #title>权限管理</template>
        </el-menu-item>
        <el-menu-item index="6" v-if="isAdmin">
          <el-icon><DataLine /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        <el-menu-item index="7" v-if="isAdmin">
          <el-icon><Files /></el-icon>
          <template #title>复审管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse" v-if="!isMobile">
            <el-icon :component="isCollapse ? Expand : Fold" />
          </el-icon>
          <el-button v-if="isMobile" icon="Menu" @click="toggleMobileMenu"></el-button>
          <h2>{{ currentPageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <el-button type="primary" icon="User">
              {{ userName }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
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
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>

  <el-drawer v-model="mobileMenuVisible" direction="ltr" size="80%">
    <el-menu
      :default-active="activeMenu"
      @select="handleSelect"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
    >
      <el-menu-item index="1">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="2">
        <el-icon><EditPen /></el-icon>
        <span>申报填写</span>
      </el-menu-item>
      <el-menu-item index="3">
        <el-icon><InfoFilled /></el-icon>
        <span>进度查询</span>
      </el-menu-item>
      <el-menu-item index="4" v-if="isReviewer || isAdmin">
        <el-icon><Document /></el-icon>
        <span>待办事项</span>
      </el-menu-item>
      <el-menu-item index="5" v-if="isAdmin">
        <el-icon><Setting /></el-icon>
        <span>权限管理</span>
      </el-menu-item>
      <el-menu-item index="6" v-if="isAdmin">
        <el-icon><DataLine /></el-icon>
        <span>数据看板</span>
      </el-menu-item>
      <el-menu-item index="7" v-if="isAdmin">
        <el-icon><Files /></el-icon>
        <span>复审管理</span>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  HomeFilled, 
  EditPen, 
  InfoFilled, 
  Document, 
  Setting, 
  ArrowDown, 
  Expand, 
  Fold, 
  Menu,
  User,
  DataLine,
  Files
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const isAdmin = ref(true)  // 暂时设置为 true，以便访问所有功能
const isReviewer = ref(true)  // 暂时设置为 true，以便访问所有功能
const userName = ref('Test User')
const mobileMenuVisible = ref(false)

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const routeTitles = {
    '/': '首页',
    '/report': '申报填写',
    '/state': '进度查询',
    '/admin/todo': '待办事项',
    '/permission-management': '权限管理',
    '/profile': '个人信息',
    '/data-dashboard': '数据看板',
    '/review-management': '复审管理'
  }
  return routeTitles[route.path] || '综合评价信息申报系统'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value
}

const handleSelect = (key: string) => {
  mobileMenuVisible.value = false
  switch (key) {
    case '1':
      router.push('/')
      break
    case '2':
      router.push('/report')
      break
    case '3':
      router.push('/state')
      break
    case '4':
      router.push('/admin/todo')
      break
    case '5':
      router.push('/permission-management')
      break
    case '6':
      router.push('/data-dashboard')
      break
    case '7':
      router.push('/review-management')
      break
  }
}

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  }
}

watch(() => route.path, () => {
  if (isMobile.value) {
    mobileMenuVisible.value = false
  }
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

.user-dropdown .el-dropdown-link {
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
  .layout-container {
    flex-direction: column;
  }

  .menu-aside {
    display: none;
  }

  .main-header {
    padding: 0 10px;
  }

  .header-left h2 {
    font-size: 18px;
    margin-left: 10px;
  }

  .el-main {
    padding: 10px;
  }

  .header-right {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }
  
  .user-dropdown {
    margin-left: 10px;
  }
  
  .el-button {
    padding: 8px 15px;
  }
  
  .el-dropdown-link {
    font-size: 14px;
  }
  
  .collapse-btn {
    background-color: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #409EFF;
  }
}
</style>