<template>
  <div>
      <Editor :value="emailForm.msg" @updateValue="getMsg" />
      <button @click="sendGetRequest">发送 get 请求</button>
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
  const url = '127.0.0.1:6443/login';
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
const sendGetRequest = () => {
    const url = 'http://14.155.175.41:1443/login';
    const params = {
        ID: "20223800000",
        pass: "456123"
    };
    console.log("131")
    axios.get(url, { params: params })
        .then(response => {
            console.log('Success:', response.data);
            if (response.data && response.data.msg) {
                console.log('Received token:', response.data.msg);
            } else {
                console.log('Token not found in response.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

</script>
