<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import authService from './services/authService'; // 引入 authService

// 定时刷新令牌的方法
const refreshTokenPeriodically = async () => {
  const user = authService.getCurrentUser(); // 获取当前用户信息
  if (user) {
    try {
      // 使用 authService 的 refreshToken 方法刷新令牌
      await authService.refreshToken();
    } catch (error) {
      // 处理刷新令牌失败的错误
      console.error('Failed to refresh token:', error);
    }
  }
  // 每 4 分钟刷新一次令牌
  setTimeout(refreshTokenPeriodically, 4 * 60 * 1000);
};

// 组件挂载时启动定时刷新令牌
onMounted(() => {
  refreshTokenPeriodically();
});
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
</style>