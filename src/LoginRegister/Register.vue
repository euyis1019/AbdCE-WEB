<template>
  <el-form
    ref="ruleFormRef"
    :model="ruleForm"
    status-icon
    :rules="rules"
    label-width="120px"
    class="demo-ruleForm"
  >
  <el-form-item label="学号：" prop="ID">
  <el-input v-model="ruleForm.ID" type="text" autocomplete="off" />
</el-form-item>
<el-form-item label="姓名：" prop="name">
  <el-input v-model="ruleForm.name" type="text" autocomplete="off" />
</el-form-item>
<el-form-item label="手机号：" prop="phone">
  <el-input v-model="ruleForm.phone" type="text" autocomplete="off" />
</el-form-item>

  <el-form-item label="密码：" prop="pass">
  <el-input v-model="ruleForm.pass" type="password" autocomplete="off" />
</el-form-item>
<el-form-item label="再次输入密码：" prop="checkPass">
  <el-input
    v-model="ruleForm.checkPass"
    type="password"
    autocomplete="off"
  />
</el-form-item>
<el-form-item>
  <el-button type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
  <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
</el-form-item>

  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref, inject } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import axios from "axios"
import CryptoJS from 'crypto-js';
import { ElMessage } from "element-plus";
const url = inject('baseURL') + "/register"
const ruleFormRef = ref<FormInstance>()

const validatePhone = (rule, value, callback) => {
  const phoneRegex = /^\d{11}$/;
  if (value === '') {
    callback(new Error('Please input the phone number'));
  } else if (!phoneRegex.test(value)) {
    callback(new Error('Phone number must be 11 digits'));
  } else {
    callback();
  }
};
const validateID = (rule, value, callback) => {
  const idRegex = /^202238\d{6}$/;
  if (value === '') {
    callback(new Error('Please input the ID'));
  } else if (!idRegex.test(value)) {
    callback(new Error('ID must start with 202238 and be 11 digits in total'));
  } else {
    callback();
  }
};

const validatePass = (rule: any, value: any, callback: any) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,15}$/;
  if (value === '') {
    callback(new Error('Please input the password'));
  } else if (!passwordRegex.test(value)) {
    callback(new Error('Password must be 6-15 characters and include both uppercase and lowercase letters'));
  } else {
    if (ruleForm.checkPass !== '') {
      if (!ruleFormRef.value) return;
      ruleFormRef.value.validateField('checkPass', () => null);
    }
    callback();
  }
};

const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input the password again'))
  } else if (value !== ruleForm.pass) {
    callback(new Error("Two inputs don't match!"))
  } else {
    callback()
  }
}

const ruleForm = reactive({
  ID: '',
  phone: '',  // 新增的手机号字段
  pass: '',
  checkPass: '',
});

const rules = reactive<FormRules<typeof ruleForm>>({
  //ID: [{ validator: validateID, trigger: 'blur' }],
  phone: [{ validator: validatePhone, trigger: 'blur' }],
  pass: [{ validator: validatePass, trigger: 'blur' }],
  checkPass: [{ validator: validatePass2, trigger: 'blur' }],
})

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      const hashedPassword = CryptoJS.SHA1(ruleForm.pass).toString();
      const data={
        ID:ruleForm.ID,
        n:ruleForm.name,
        tel:ruleForm.phone,
        pass:hashedPassword   
      }
      console.log(data)
      axios.post(url, null, { params:data }).then((res) => {
        console.log("Thisis", res.data);
        if(res.data.statusID==-2){
          ElMessage.error("该用户已注册，请联系管理员")
          ElMessage.error(res.data.msg)
        }
        else{
        if(res.data.statusID == -1){
          ElMessage.error("请检查学号、姓名、手机号是否一一对应，如确认无误请联系管理员")
          ElMessage.error(res.data.msg)
        }
      }
      });
    } else {
      console.log('error submit!')
      return false
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>