<template>
  <div>
    <QuillEditor ref="myQuillEditor"
      theme="snow"
      v-model:content="content"
      :options="data.editorOption"
      contentType="html"
      @update:content="setValue"
    />
    <!-- 使用自定义文件上传 -->
    <input type="file" hidden accept=".jpg,.png,.pdf" ref="fileBtn" @change="handleUpload" />
  </div>
</template>

<script setup>
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { reactive, onMounted, ref, toRaw, defineProps, defineEmits } from 'vue'
import axios from 'axios'

const backsite = {
  // 定义你的各种 API 请求
  // 例如:
  uploadFile: (formData) => axios.post('/NewReport', formData),
  // ...
};

const props = defineProps(['value'])
const emit = defineEmits(['updateValue'])
const content = ref('')
const myQuillEditor = ref()
const fileBtn = ref()
const data = reactive({
  content: '',
  editorOption: {
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'header': 1 }, { 'header': 2 }],
        ['image', 'upload'],
        [{ 'direction': 'rtl' }],
        [{ 'color': [] }, { 'background': [] }]
      ]
    },
    placeholder: '请输入内容...'
  }
})

const imgHandler = (state) => {
  if (state) {
    fileBtn.value.click()
  }
}

const setValue = () => {
  const text = toRaw(myQuillEditor.value).getHTML()
  emit('updateValue', text)
}

const handleUpload = async (e) => {
  const files = Array.from(e.target.files)
  if (!files || files.length === 0) {
    return
  }

  const formData = new FormData()
  formData.append('file', files[0])
  
  const response = await backsite.uploadFile(formData)
  const fileUrl = response.data.url

  if (fileUrl.toLowerCase().endsWith('.pdf')) {
    // Handle PDF file upload
    insertPdfLinkToQuill(fileUrl)
  } else if (fileUrl.toLowerCase().endsWith('.jpg') || fileUrl.toLowerCase().endsWith('.png')) {
    // Handle image file upload
    insertImageToQuill(fileUrl)
  }
}

const insertPdfLinkToQuill = (pdfUrl) => {
  const quill = toRaw(myQuillEditor.value).getQuill()
  const length = quill.getSelection().index
  quill.insertText(length, `\nPDF File: ${pdfUrl}\n`)
}

const insertImageToQuill = (imageUrl) => {
  const quill = toRaw(myQuillEditor.value).getQuill()
  const length = quill.getSelection().index
  quill.insertEmbed(length, 'image', imageUrl)
  quill.setSelection(length + 1)
}

onMounted(() => {
  const quill = toRaw(myQuillEditor.value).getQuill()
  if (myQuillEditor.value) {
    quill.getModule('toolbar').addHandler('image', imgHandler)
  }
  toRaw(myQuillEditor.value).setHTML(props.value)
})
</script>

<style scoped lang="scss">
:deep(.ql-editor) {
  min-height: 180px;
}
:deep(.ql-formats) {
  height: 21px;
  line-height: 21px;
}
</style>
