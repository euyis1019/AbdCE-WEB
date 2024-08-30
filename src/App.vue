<template>
  <FullscreenLoader :show="authStore.isLoading" />
  <router-view v-if="!authStore.isLoading"></router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from './services/authService'
import Cookies from 'js-cookie'
import FullscreenLoader from '@/components/FullscreenLoader.vue'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const token = Cookies.get('jwt_token')
  if (token) {
    try {
      const isValid = await authService.verifyToken(token)
      if (!isValid) {
        throw new Error('Token is invalid or expired')
      }
      await authStore.fetchPermissionLevel()
    } catch (error) {
      console.error('Authentication failed:', error)
      Cookies.remove('jwt_token')
      window.location.href = process.env.VUE_APP_SSO_URL + 'ce/login.html'
    }
  } else {
    authStore.isLoading = false
  }
})
</script>