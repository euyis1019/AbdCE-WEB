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
                <el-button type="info" plain @click="handleRegister"> 注册</el-button>
                <el-button type="info" plain @click="handleLogin">按我获得跳转到子界面的权限</el-button>
              </div>
            </el-form>
          </div>

        </el-col>
      </el-row>
    </el-card>
  </div>
</template>


<style src="./login-style.css"></style>





<script setup>
import { inject, reactive, ref } from "vue";
import { useRouter } from "vue-router";
//import axios from 'axios'// 引入axios
import { ElMessage } from "element-plus"; //消息提醒框
import { useStore } from "vuex"; // 引入全局store
import axios from "axios"
import CryptoJS from 'crypto-js';

const store = useStore();
const handleLogin = () => {
  localStorage.setItem("token", "d8ebd2a9-3b6f-46be-a873-868da52b60ac");
  router.push("/Record");
};
const handleRegister = () =>{
  router.push("/Register")
}

// 表单绑定的响应式对象
const loginForm = reactive({
  username: "",
  password: "",
});
const loginFormRef = ref(); //表单的引用对象

// 配置表单的验证规则
const loginRules = reactive({
  username: [
    // 用户名
    {
      // 必须填入,表单提示,触发方式:失去焦点(判断是否通过表单验证)
      required: true,
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  password: [
    // 密码
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
  ],
});
const url = inject('baseURL') + "/login";
// 引入路由
const router = useRouter();
//提交表单函数
const submitForm = () => {
  //1. 校验表单(获取输入的表单数据)[validate为elementPlus中表单验证内置方法]
  loginFormRef.value.validate((valid) => {
    console.log("判断输入的数据是否通过表单校验:", valid); // 手动校验表单是否有值

    // 额外的验证
    const usernameValid = loginForm.username.length === 11;
    const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{7,}$/;
    const passwordValid = passwordPattern.test(loginForm.password);

    if (!usernameValid) {
      ElMessage.error("用户名应该是11位");
      return;
    }

    if (!passwordValid) {
      ElMessage.error("密码应该大于6位，并且同时包含数字、小写字母和大写字母");
      return;
    }
    const hashedPassword = CryptoJS.SHA1(loginForm.password).toString();

    const params = {
      ID: loginForm.username,
      pass: hashedPassword
    };
    if (valid) {
      console.log("成功获取到表单内容:", { params: params });
      axios.post(url, null, { params: params }).then((res) => {
        console.log("Thisis", res.data);
        // 登录校验
        if (res.data.msg === "登录成功") {
          localStorage.setItem("token", res.data.data.Token);
          //store.commit("changeUserInfo",res.data.data)// 将用户信息保存到vuex中
          //store.commit("changeGetterRouter",false)
          localStorage.setItem("Permission", res.data.data.Permission)
          localStorage.setItem("Class", res.data.data.Cls)
          localStorage.setItem("ID",params.ID)
          router.push("/Report"); //路由跳转
          console.log()
        } else {
          console.log(res.data.msg);
          ElMessage.error("用户名和密码不匹配");
        }
      });
    }
  });

  //2. 拿到表单内容,提交后台

  //3. 设置token
  /*localStorage.setItem("token", "lam");*/
};
</script>