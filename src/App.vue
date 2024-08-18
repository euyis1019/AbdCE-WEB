<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from './services/authService'

const router = useRouter()

let cleanupRefresh;

onMounted(() => {
  cleanupRefresh = authService.setupTokenRefresh();

  const token = localStorage.getItem('jwt_token')
  if (token) {
    authService.verifyToken(token).then(isValid => {
      if (!isValid) {
        // 令牌无效,重定向到SSO登录页面
        window.location.href = process.env.VUE_APP_SSO_URL + '/login.html'
      }
    })
  } else {
    // 没有令牌,重定向到SSO登录页面
    window.location.href = process.env.VUE_APP_SSO_URL + '/login.html'
  }
})

onUnmounted(() => {
  if (cleanupRefresh) {
    cleanupRefresh();
  }
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
</style>