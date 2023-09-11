<template>
    <div class="modal">
      <div class="modal-content">
        <span class="close" @click="emitClose">&times;</span>
        <h2>上传文件</h2>
        <div @dragover.prevent @drop="onDrop" class="dropzone">
          拖曳文件到这里或者 <input type="file" @change="onFileChange">
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, defineEmits } from 'vue';
  
  const emit = defineEmits();
  
  const onFileChange = (e) => {
    const files = e.target.files;
    uploadFiles(files);
  };
  
  const onDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    uploadFiles(files);
  };
  
  const uploadFiles = (files) => {
    // 这里你可以添加文件上传的逻辑
    console.log(files);
  };
  
  const emitClose = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7); /* 黑色半透明背景 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    width: 80%;
    max-width: 500px;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .close {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    font-size: 24px;
  }
  
  .dropzone {
    border: 2px dashed #ccc;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    margin-top: 20px;
    transition: border-color 0.3s;
  }
  
  .dropzone:hover {
    border-color: #888;
  }
  </style>
  