<!-- src/components/FullscreenLoader.vue -->
<template>
    <div v-if="show" class="fullscreen-loader">
      <el-loading :fullscreen="true" />
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    show: boolean
  }>()
  </script>
  
  <style scoped>
  .fullscreen-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  </style>