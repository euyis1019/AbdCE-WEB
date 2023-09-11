<template>
    <div>
      <el-button type="primary" @click="showModal = true">上传文件</el-button>
      <file-upload-modal v-if="showModal" @close="showModal = false"></file-upload-modal>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import FileUploadModal from './FileUploadModal.vue';
  
  const showModal = ref(false);
  </script>
  