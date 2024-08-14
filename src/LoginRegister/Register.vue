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
      <el-button type="primary" @click="submitForm(ruleFormRef)">提交</el-button>
      <el-button @click="resetForm(ruleFormRef)">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import axios from "axios"
import CryptoJS from 'crypto-js';
import { ElMessage } from "element-plus";

const ruleFormRef = ref<FormInstance>()

const validatePhone = (rule, value, callback) => {
  const phoneRegex = /^\d{11}$/;
  if (value === '') {
    callback(new Error('请输入手机号'));
  } else if (!phoneRegex.test(value)) {
    callback(new Error('手机号必须为11位数字'));
  } else {
    callback();
  }
};

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'));
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
    callback(new Error('请再次输入密码'))
  } else if (value !== ruleForm.pass) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const ruleForm = reactive({
  ID: '',
  name: '',
  phone: '',
  pass: '',
  checkPass: '',
});

const rules = reactive<FormRules<typeof ruleForm>>({
  ID: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ validator: validatePhone, trigger: 'blur' }],
  pass: [{ validator: validatePass, trigger: 'blur' }],
  checkPass: [{ validator: validatePass2, trigger: 'blur' }],
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      const hashedPassword = CryptoJS.SHA1(ruleForm.pass).toString();
      const data = {
        ID: ruleForm.ID,
        n: encodeURIComponent(ruleForm.name),
        tel: ruleForm.phone,
        pass: hashedPassword   
      }
      try {
        const response = await axios.post('/register', null, { params: data });
        if (response.data.statusID === 0) {
          ElMessage.success(response.data.msg || "注册成功");
        } else {
          ElMessage.error(response.data.msg || "注册失败，请重试");
        }
      } catch (error) {
        console.error("注册失败:", error);
        ElMessage.error("注册失败，请重试");
      }
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