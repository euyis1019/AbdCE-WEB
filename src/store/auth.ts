// src/store/auth.ts
import { defineStore } from 'pinia'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    permissionLevel: 0,
    isLoading: true,
  }),
  actions: {
    async fetchPermissionLevel() {
      this.isLoading = true
      try {
        this.permissionLevel = await authService.checkUserPermission()
      } catch (error) {
        console.error('Error fetching permission level:', error)
      } finally {
        this.isLoading = false
      }
    },
  },
})