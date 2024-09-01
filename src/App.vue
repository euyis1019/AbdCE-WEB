<template>
  <FullscreenLoader v-if="authStore.isLoading" />
  <router-view v-else></router-view>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import authService from './services/authService'
import Cookies from 'js-cookie'
import FullscreenLoader from '@/components/FullscreenLoader.vue'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const token = Cookies.get('jwt_token');
  if (token) {
    try {
      const isValid = await authService.verifyToken(token);
      if (!isValid) {
        throw new Error('Token is invalid or expired');
      }
      await authStore.verifyPermission();
    } catch (error) {
      console.error('Authentication failed:', error);
      Cookies.remove('jwt_token');
      window.location.href = process.env.VUE_APP_SSO_URL + 'ce/login.html';
    }
  } else {
    authStore.isLoading = false;
  }
})

// 监听路由变化，确保在路由变化时重新验证权限
watch(() => router.currentRoute.value, async () => {
  if (Cookies.get('jwt_token')) {
    await authStore.verifyPermission();
  }
})
</script>