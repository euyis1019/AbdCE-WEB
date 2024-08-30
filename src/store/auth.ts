// src/store/auth.ts

import { defineStore } from 'pinia'
import authService from '@/services/authService'
import router from '@/router'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    permissionLevel: 0,
    isLoading: true,
    lastVerificationTime: 0,
  }),
  actions: {
    async verifyPermission() {
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds

      if (now - this.lastVerificationTime < fiveMinutes) {
        return this.permissionLevel
      }

      this.isLoading = true
      try {
        const newPermission = await authService.checkUserPermission()
        const storedPermission = localStorage.getItem('userPermission')

        if (storedPermission === null || parseInt(storedPermission) !== newPermission) {
          localStorage.setItem('userPermission', newPermission.toString())
          if (this.permissionLevel !== 0 && this.permissionLevel !== newPermission) {
            ElMessage.warning('您的权限已更改，请重新登录')
            router.push('/')
          }
          this.permissionLevel = newPermission
        } else {
          this.permissionLevel = newPermission
        }
        this.lastVerificationTime = now
        return this.permissionLevel
      } catch (error) {
        console.error('Error verifying permission:', error)
        return 0
      } finally {
        this.isLoading = false
      }
    },
  },
})