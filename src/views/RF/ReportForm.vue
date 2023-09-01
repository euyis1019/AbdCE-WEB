<template>
  <div>
      <Editor :value="emailForm.msg" @updateValue="getMsg" />
      <button @click="sendPostRequest">发送 POST 请求</button>
  </div>
</template>

<script setup>
import Editor from '@/components/Editor.vue'
import { reactive } from 'vue'
import axios from 'axios';

const emailForm = reactive({
  msg: ''
})

const getMsg = (val) => {
  emailForm.msg = val
}

const sendPostRequest = () => {
  const url = 'http://14.155.175.41:1443';
  const data = {
      username:"20223801024",
      password:"123456"
  };
  axios.post(url, data)
      .then(response => {
          console.log('Success:', response.data);
      })
      .catch(error => {
          console.error('Error:', error);
      });
}
</script>
