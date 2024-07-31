<template>
    <div class="statistic">
      <div class="statistic-icon">
        <el-icon :size="36" :color="iconColor"><component :is="icon" /></el-icon>
      </div>
      <div class="statistic-content">
        <div class="statistic-title">{{ title }}</div>
        <div class="statistic-value">{{ value }}</div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  
  const props = defineProps<{
    title: string
    value: number
    icon: string
  }>()
  
  const iconColor = computed(() => {
    const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
    return colors[Math.floor(Math.random() * colors.length)]
  })
  </script>
  
  <style scoped>
  .statistic {
    display: flex;
    align-items: center;
    padding: 16px;
  }
  
  .statistic-icon {
    margin-right: 16px;
  }
  
  .statistic-content {
    flex: 1;
  }
  
  .statistic-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 4px;
  }
  
  .statistic-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
  }
  </style>