<template>
    <!-- 组件库的布局容器设置 -->
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapsed ? '0' : '200px'">
        <h1 class="nav-title">导航条</h1>
        <el-menu>
            <el-menu-item index="1" @click="handleClick">
                <el-icon>
                    <message-box />
                </el-icon> <!-- 使用文档图标 -->
                <span slot="title">代办项目</span>
            </el-menu-item>
            <el-menu-item index="2" @click="handleClick1">
                 
                <el-icon>
                    <edit/>
                </el-icon><!-- 使用编辑图标 -->
                <span slot="title">提交申请</span>
            </el-menu-item>

            <el-menu-item index="5" @click="handleClick2">
                 
                 <el-icon>
                 </el-icon><!-- 使用编辑图标 -->
                 <span slot="title">申请进度</span>
             </el-menu-item>
            <el-menu-item v-if="showAuditButton" index="3" @click="Audit">
                <el-icon>
                    <Files />
                </el-icon> 
                <span slot="title">审核</span>
            </el-menu-item>

            <el-menu-item index="4" @click="state">
                <el-icon>
                    
                </el-icon> 
                <span slot="title">个人状态</span>
            </el-menu-item>

            <el-menu-item index="5" @click="logout">
                <el-icon>
                    <close />
                </el-icon> 
                <span slot="title">退出</span>
            </el-menu-item>

        </el-menu>
      </el-aside>

      <el-container direction="vertical">
        <!-- 顶部头部部分 -->
        <el-header class="custom-header">
    
          <el-button class="toggle-button" @click="toggleNav">
            <el-icon>
                    <Menu />
                </el-icon>
            </el-button>
          <h2 class="header-title">阿伯丁学院综合评价信息申报系统</h2>
          
          <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="handleLogout">退出登录(unrealized)</el-dropdown-item>
                    </el-dropdown-menu>
        </template>

        </el-header>
  
        <!-- 内容主题区域 -->
        <el-main>
          <RouterView></RouterView>
        </el-main>
      </el-container>
    </el-container>
</template>

<script>
//import { Files } from '@element-plus/icons-vue/dist/types';
//这有啥用？
export default {
    data() {
        return {
            isCollapsed: false,
            showAuditButton:false
        };
    },
    mounted(){
        let permission = localStorage.getItem("Permission");
        if (permission && Number(permission) > 1) {
            this.showAuditButton = true; // 如果权限大于1，则显示审核按钮
        }
    },
    methods: {
        handleClick() {
            this.$router.push('/Record');
        },
        handleClick1() {
            this.$router.push('/Report');
        },
        handleClick2(){
            this.$router.push('/reportstate');
        },
        toggleNav() {
            this.isCollapsed = !this.isCollapsed;
        },
        Audit(){
            this.$router.push('/admin');
        },
        state(){
            this.$router.push('/state');
        },
        logout() {
            localStorage.clear();
            this.$router.push('login');
        }
    },
    //components: { Files }
}
</script>

<style scoped>
.nav-title {
    font-size: 20px;
    text-align: center;
    margin-bottom: 15px;
    color: #333;
}

.custom-header {
    background-color: rgb(2, 2, 215);
    display: flex;
    align-items: center;
}

.header-title {
    color: white;
    margin: 0;
    flex: 1;
    text-align: center;
}

.toggle-button {
    background: transparent;
    border: none;
    color: rgb(255, 255, 255);
    size:20
}
</style>
