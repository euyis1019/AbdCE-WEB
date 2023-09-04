<template>
    <div>
      <QuillEditor ref="myQuillEditor"
        theme="snow"
        v-model:content="content"
        :options="data.editorOption"
        contentType="html"
        @update:content="setValue()"
      />
      <!-- 使用自定义图片上传 -->
      <input type="file" hidden accept=".jpg,.png" ref="fileBtn" @change="handleUpload" />
    </div>
  </template>
  
  <script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import { reactive, onMounted, ref, toRaw, watch } from 'vue'
  
  
  const props = defineProps(['value'])
  const emit = defineEmits(['updateValue'])
  const content = ref('')
  const myQuillEditor = ref()
  // watch(() => props.value, (val) => {
  //   console.log(toRaw(myQuillEditor.value))
  //   toRaw(myQuillEditor.value).setHTML(val)
  // }, { deep: true })
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
          ['image'],
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
  const handleUpload = (e) => {
    const files = Array.prototype.slice.call(e.target.files)
    // console.log(files, "files")
    if (!files) {
      return
    }
    const formdata = new FormData()
    formdata.append('file', files[0])
    backsite.uploadFile(formdata)
      .then(res => {
        if (res.data.url) {
          const quill = toRaw(myQuillEditor.value).getQuill()
          const length = quill.getSelection().index
          // 插入图片，res为服务器返回的图片链接地址
          quill.insertEmbed(length, 'image', res.data.url)
          // 调整光标到最后
          quill.setSelection(length + 1)
        }
      })
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

  