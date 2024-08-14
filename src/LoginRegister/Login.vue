<template>
  <div class="container">
    <el-card class="login-card" shadow="always">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="image-section uniform-margin">
            <img src="../assets/校园全景照.jpg" alt="展示图片1" class="background-image" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="login-section uniform-margin">
            <h3 class="header">统一身份认证登录SSO services authentication</h3>
            <el-divider></el-divider>
            <el-row :gutter="20" class="uniform-padding">
              <el-col :span="24">
                <el-card shadow="always" class="uniform-margin">
                  <p class="custom-font">您即将登录: <strong>综合服务平台华南师范大学阿伯丁数据科学与人工智能学院综测填报系统</strong></p>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <div class="formContainer uniform-margin">
            <el-form ref="loginFormRef" :model="loginForm" status-icon :rules="loginRules" label-width="80px"
              class="loginform">
              <el-form-item label="">
                <label for="username"><strong>用户名</strong>Username：</label>
                <el-input id="username" v-model="loginForm.username" autocomplete="off" />
              </el-form-item>
              <el-form-item label="">
                <label for="password"><strong>密码</strong>Password：</label>
                <el-input id="password" v-model="loginForm.password" type="password" autocomplete="off" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitForm()" style="width: 100%;"><strong>登录</strong>Sign
                  in</el-button>
              </el-form-item>
              <div class="uniform-margin">
                <el-button type="info" plain @click="handleRegister">注册</el-button>
              </div>
            </el-form>
          </div>

        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style src="./login-style.css"></style>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import axios from "axios";
import CryptoJS from 'crypto-js';

const router = useRouter();

const loginForm = reactive({
  username: "",
  password: "",
});
const loginFormRef = ref();

const loginRules = reactive({
  username: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
  ],
});

const submitForm = () => {
  loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      // 开始：测试登录逻辑
      if (loginForm.username === "testuser" && loginForm.password === "testpassword") {
        console.log("使用测试账号登录");
        localStorage.setItem("token", "test-token");
        localStorage.setItem("Permission", "3"); // 赋予最高权限以便测试所有功能
        localStorage.setItem("Class", "TestClass");
        localStorage.setItem("ID", "TestID");
        localStorage.setItem("userName", "TestUser");
        router.push("/");
        return;
      }
      // 结束：测试登录逻辑

      const hashedPassword = CryptoJS.SHA1(loginForm.password).toString();

      try {
        const response = await axios.post('/login', null, {
          params: {
            ID: loginForm.username,
            pass: hashedPassword
          }
        });

        if (response.data.statusID === 0) {
          localStorage.setItem("token", response.data.data.Token);
          localStorage.setItem("Permission", response.data.data.Permission);
          localStorage.setItem("Class", response.data.data.Cls);
          localStorage.setItem("ID", loginForm.username);
          localStorage.setItem("userName", response.data.data.Name);
          router.push("/");
        } else {
          ElMessage.error(response.data.msg || "登录失败，请重试");
        }
      } catch (error) {
        console.error("登录失败:", error);
        ElMessage.error("登录失败，请重试");
      }
    }
  });
};

const handleRegister = () => {
  router.push("/Register");
}
</script>
```