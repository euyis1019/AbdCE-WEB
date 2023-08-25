<template>
  <el-row>
    <el-col :span="17">
      <div class="grid-content bg-purple">
        <span class="logo-lg">
          <img src="../assets/校园全景照.jpg" alt="展示图片1" height="800" weight="150">
        </span>
      </div>
    </el-col>


    <el-col :span="7">
      <!-- 添加一个外层的 el-row 组件，用于垂直居中 -->
      <el-row type="flex" justify="center" align="middle" style="height: 50%;">
        <!-- 添加一个内层的 el-col 组件，用于水平居中 -->
        <el-col :span="20">
          <!-- 添加一个中间层的 el-row 组件，用于垂直居中 -->
          <el-row type="flex" justify="center" align="middle" style="height: 70%;">
            <!-- 添加一个中间层的 el-col 组件，用于水平居中 -->
            <el-col :span="24">
              <div class="grid-content bg-purple-light">
                <br>
                <br>
                <br>
                <br>
                <br>
                <br>
                <br>
                <br>

                <span class="logo-lg1">
                  <img src="../assets/小校徽.png" alt="展示图片1" height="100" weight="100">
                </span>


                <h2>华南师范大学阿伯丁数据科学与人工智能学院综测填报系统网站</h2>
                <!-- 登录表单验证 -->
                <div class="formContainer">
                  <el-form ref="loginFormRef" :model="loginForm" status-icon :rules="loginRules" label-width="80px"
                    class="loginform">
                    <br>
                    <el-form-item label="用户名" prop="username">
                      <el-input v-model="loginForm.username" autocomplete="off" />
                    </el-form-item>
                    <el-form-item label="密码" prop="password">
                      <el-input v-model="loginForm.password" type="password" autocomplete="off" />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="submitForm()">登录</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                <br>
                <br>
                <el-button type="info" plain @click="handleLogin">按我获得跳转到子界面的权限</el-button>
              </div>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-col>




  </el-row>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
//import axios from 'axios'// 引入axios
import { ElMessage } from "element-plus"; //消息提醒框
import { useStore } from "vuex"; // 引入全局store

const store = useStore();
const handleLogin = () => {
  localStorage.setItem("token", "ForTest");
  router.push("/Report");
};

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

// 引入路由
const router = useRouter();
//提交表单函数
const submitForm = () => {
  //1. 校验表单(获取输入的表单数据)[validate为elementPlus中表单验证内置方法]
  loginFormRef.value.validate((valid) => {
    console.log("判断输入的数据是否通过表单校验:", valid); // 手动校验表单是否有值
    if (valid) {
      console.log("成功获取到表单内容:", loginForm);
      axios.post("/adminapi/user/login", loginForm).then((res) => {
        console.log(res.data);
        // 登录校验
        if (res.data.ActionType === "OK") {
          // console.log('返回的用户数据',res.data.data);
          //store.commit("changeUserInfo",res.data.data)// 将用户信息保存到vuex中
          //store.commit("changeGetterRouter",false)
          router.push("/Report"); //路由跳转
          console.log(1);
          // localStorage.setItem("token", "lam");//色湖之token
        } else {
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
