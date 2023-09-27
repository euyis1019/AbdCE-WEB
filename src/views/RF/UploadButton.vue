<template>
    <el-upload
      ref="upload"
      class="upload-demo"
      :action='computedActionUrl'
      :on-preview="handlePreview"
      :limit="1"
      name = "file"
      :on-exceed="handleExceed"
      :auto-upload="false"
      :before-upload="beforeFileUpload"
      :on-success="handleUploadSuccess"
    >
      <template #trigger>
        <el-button type="primary">选择文件</el-button>
      </template>
      <el-button class="ml-3" type="success" @click="submitUpload">
        提交文件
      </el-button>
      <template #tip>
        <div class="el-upload__tip text-red">
          limit 1 file, new file will cover the old file
        </div>
      </template>
    </el-upload>
  </template>
  
  <script setup lang="ts">
  import { ref ,computed,inject, defineProps, defineEmits} from 'vue'
  import { genFileId } from 'element-plus'
  import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'

  const { fileUrl } = defineProps(['fileUrl']);
  const emit = defineEmits();

  const upload = ref<UploadInstance>()

  const additionalData = {
  t: localStorage.getItem('token'),
  ID:20223804039,
}
const baseURL = inject('baseURL');
const actionUrl = baseURL + '/report/upload';
const actionUrlRef = ref(actionUrl)
const computedActionUrl = computed(() => actionUrlRef.value)
const beforeFileUpload = (file: UploadRawFile) => {
  console.log(additionalData.t)
  // 添加查询参数
  actionUrlRef.value = `${actionUrl}?t=${additionalData.t}&ID=${additionalData.ID}`
  return true
}
const headers = {
  "Content-type": "multipart/form-data"
}
  
  const handleExceed: UploadProps['onExceed'] = (files) => {
    upload.value!.clearFiles()
    const file = files[0] as UploadRawFile
    file.uid = genFileId()
    upload.value!.handleStart(file)
  }
  
  const submitUpload = () => {
    upload.value!.submit()

  }
  const uploadedFileUrls = ref<Record<string, string>>({});  // 注意我将变量名改为了 uploadedFileUrls

const handleUploadSuccess = (response: any, file: any, fileList: any) => {
  // 处理服务器的响应
  if (response.url==undefined) {
    alert("未上传成功，请联系管理员");
    console.log(99)
    return;
  }
  else{
    const fileUrl = baseURL + (response.url.startsWith('./') ? response.url.slice(1) : response.url);  // 这里我将变量名改为了 fileUrl，以避免与外部的 ref 对象命名冲突
    const fileUrl2 =  (response.url.startsWith('./') ? response.url.slice(1) : response.url)
    console.log(response.url)
    console.log("Uploaded File URL:", fileUrl);
    uploadedFileUrls.value[file.uid] = fileUrl;
    emit('file-uploaded', fileUrl2); // 发出自定义事件
  
  }  
}
const handlePreview = (file: any) => {
  const url = uploadedFileUrls.value[file.uid];  // 使用外部的 ref 对象
  if (url) {
    window.open(url, '_blank');
  }
}

  </script>
  