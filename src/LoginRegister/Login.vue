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

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import authService from "../services/authService"; // 引入 authService

// 定义路由实例
const router = useRouter();

// 定义登录表单数据
const loginForm = reactive({
  username: "",
  password: "",
});
// 定义登录表单引用
const loginFormRef = ref();

// 定义登录表单验证规则
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

// 提交登录表单的方法
const submitForm = () => {
  // 验证表单
  loginFormRef.value.validate(async (valid: boolean) => {
    // 如果表单验证通过
    if (valid) {
      try {
        // 使用 authService 的 login 方法进行登录
        const response = await authService.login(loginForm.username, loginForm.password); 
        // 登录成功，显示提示信息
        ElMessage.success("登录成功"); 
        // 跳转到首页
        router.push("/"); 
      } catch (error) {
        // 处理登录失败的错误
        console.error("登录失败:", error); 
        // 显示错误提示信息
        ElMessage.error("登录失败，请重试"); 
      }
    }
  });
};

// 跳转到注册页面的方法
const handleRegister = () => {
  router.push("/Register");
}
</script>

<style src="./login-style.css"></style>