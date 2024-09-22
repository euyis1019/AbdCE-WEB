<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="menu-aside" v-if="!isMobile">
      <div class="logo">
        <img src="../assets/logo.svg" alt="Logo" />
        <span v-if="!isCollapse">综合素质评价系统</span>
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
        <el-menu-item index="4" v-if="permissionLevel > 0">
          <el-icon><Document /></el-icon>
          <template #title>待办事项</template>
        </el-menu-item>
        <el-menu-item index="5" v-if="permissionLevel >= 30">
          <el-icon><Setting /></el-icon>
          <template #title>权限管理</template>
        </el-menu-item>
        <el-menu-item index="7" v-if="permissionLevel >= 30">
          <el-icon><Files /></el-icon>
          <template #title>复审管理</template>
        </el-menu-item>
        <el-menu-item index="8" v-if="permissionLevel >= 30">
          <el-icon><DataLine /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        <!-- 新增批量导入菜单项 -->
        <el-menu-item index="9" v-if="permissionLevel >= 30">
          <el-icon><Upload /></el-icon>
          <template #title>批量导入</template>
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
      <el-menu-item index="4" v-if="permissionLevel > 0">
        <el-icon><Document /></el-icon>
        <span>待办事项</span>
      </el-menu-item>
      <el-menu-item index="5" v-if="permissionLevel >= 30">
        <el-icon><Setting /></el-icon>
        <span>权限管理</span>
      </el-menu-item>
      <el-menu-item index="7" v-if="permissionLevel >= 30">
        <el-icon><Files /></el-icon>
        <span>复审管理</span>
      </el-menu-item>
      <el-menu-item index="8" v-if="permissionLevel >= 30">
        <el-icon><DataLine /></el-icon>
        <span>数据看板</span>
      </el-menu-item>
      <!-- 新增批量导入菜单项（移动端） -->
      <el-menu-item index="9" v-if="permissionLevel >= 30">
        <el-icon><Upload /></el-icon>
        <span>批量导入</span>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import authService from '../services/authService';
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
  Files,
  DataLine,
  Upload // 新增 Upload 图标
} from '@element-plus/icons-vue'

const router = useRouter();
const route = useRoute();

// 控制侧边栏折叠状态
const isCollapse = ref(false);
// 用户名
const userName = ref('');
// 控制移动端菜单可见性
const mobileMenuVisible = ref(false);
// 用户权限等级
const permissionLevel = ref(0);

// 判断是否为移动设备
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 组件挂载时执行
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  checkAuth();
});

// 检查用户认证和权限
const checkAuth = async () => {
  const user = authService.getCurrentUser(); 
  if (!user) { 
    window.location.href = `${process.env.VUE_APP_SSO_URL}ce/login.html`; 
    return;
  }

  userName.value = user.Name || 'User';
  permissionLevel.value = await authService.checkUserPermission();
};

// 计算当前激活的菜单项
const activeMenu = computed(() => route.path);

// 计算当前页面标题
const currentPageTitle = computed(() => {
  const routeTitles = {
    '/': '首页',
    '/report': '申报填写',
    '/state': '进度查询',
    '/admin/todo': '待办事项',
    '/permission-management': '权限管理',
    '/review-management': '复审管理',
    '/data-dashboard': '数据看板',
    '/bulk-import': '批量导入' // 新增批量导入页面标题
  };
  return routeTitles[route.path] || '综合素质评价信息申报系统';
});

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 切换移动端菜单可见性
const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value;
};

// 处理菜单选择
const handleSelect = (key: string) => {
  mobileMenuVisible.value = false;
  switch (key) {
    case '1':
      router.push('/');
      break;
    case '2':
      router.push('/report');
      break;
    case '3':
      router.push('/state');
      break;
    case '4':
      router.push('/admin/todo');
      break;
    case '5':
      router.push('/permission-management');
      break;
    case '7':
      router.push('/review-management');
      break;
    case '8':
      router.push('/data-dashboard');
      break;
    case '9':
      router.push('/bulk-import'); // 新增批量导入路由
      break;
  }
};

// 处理用户下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'logout') {
    logout();
  } else if (command === 'profile') {
    goToSSOProfile();
  }
};

// 退出登录
const logout = async () => {
  try {
    await authService.logout();
    ElMessage.success('登出成功');
  } catch (error) {
    console.error('Logout failed:', error);
    ElMessage.error('登出失败,请重试');
  }
};

// 跳转到SSO个人资料页面
const goToSSOProfile = () => {
  window.location.href = process.env.VUE_APP_SSO_URL ; 
};

// 监听路由变化，关闭移动端菜单
watch(() => route.path, () => {
  if (isMobile.value) { 
    mobileMenuVisible.value = false; 
  }
});
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