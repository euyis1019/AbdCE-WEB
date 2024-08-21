<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from './services/authService'
import Cookies from 'js-cookie'

const router = useRouter()

onMounted(async () => {
  const token = Cookies.get('jwt_token')
  if (token) {
    try {
      const isValid = await authService.verifyToken(token)
      if (!isValid) {
        throw new Error('Token is invalid or expired')
      }
      // Token is valid, do nothing
    } catch (error) {
      console.error('Authentication failed:', error)
      Cookies.remove('jwt_token')
      window.location.href = process.env.VUE_APP_SSO_URL + 'login.html'
    }
  }
})
</script>
