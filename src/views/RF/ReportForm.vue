<template>
    <div>
      <div>
        <label>姓名：</label>
        <input v-model="info.name" />
      
        <label>班级：</label>
        <input v-model="info.class" />
      
        <label>学号：</label>
        <input v-model="info.studentId" />
      </div>
  
      <h2>思想品德模块</h2>
      <!-- 学业表现模块、体育素养模块、美育素养模块、劳动素养模块的表格和添加按钮类似，后续可添加 -->
      <button @click="addMoralValue">添加项目</button>
      <button @click="removeMoralValue(index)">删除项目</button>
      <button @click="saveForm">保存</button>
      <button @click="loadForm">加载暂存数据</button>
      <table>
        <thead>
          <tr>
            <th>初始序号</th>
            <th>项目（大分类）</th>
            <th>项目（小分类）</th>
            <th>项目（子分类）</th>
            <th>得分</th>
            <th>扣分</th>
            <th>材料页码</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in moralValues" :key="index">
            <td>{{ index + 1 }}</td>
            <td><input v-model="item.category" /></td>
            <td><input v-model="item.subcategory" /></td>
            <td><input v-model="item.subcategory" /></td>
            <td><input v-model="item.score" type="number" step="1" min="0" max="100" /></td>
            <td><input v-model="item.deduction" type="number" step="1" min="0" max="100" /></td>
            <td><input v-model="item.page" type="number" min="1" /></td>
          </tr>
        </tbody>
      </table>
      
      <button @click="CreatePreviewPage">点击生成预览页</button>
      <quill-editor ref="myTextEditor" v-model="content" :options="editorOption" ></quill-editor>
      <button @click="Submit">提交</button>

    </div>
  </template>
  
  <script>
  export default {
    components: {
      quillEditor
    },


    data() {
      return {
        info: {
          name: "",
          class: "",
          studentId: ""
        },
        moralValues: [],
        // 其他模块的数据类似定义
        formKey: "student_evaluation_form"
      };
    },
    methods: {
      addMoralValue() {
        this.moralValues.push({
          category: "",
          subcategory: "",
          score: "",
          deduction: "",
          page: ""
        });
      },
      // 其他模块的添加方法类似定义
      removeMoralValue(index) {
        this.moralValues.splice(index, 1);
      },
  
      saveForm() {
        const formData = {
          info: this.info,
          moralValues: this.moralValues
          // 其他模块的数据类似添加
        };
  
        localStorage.setItem(this.formKey, JSON.stringify(formData));
        alert("表单已保存");
      },
  
      loadForm() {
        const formData = localStorage.getItem(this.formKey);
        if (formData) {
          const parsedData = JSON.parse(formData);
          this.info = parsedData.info;
          this.moralValues = parsedData.moralValues;
          // 其他模块的数据类似加载
          alert("暂存数据已加载");
        } else {
          alert("没有暂存数据");
        }
      },

      CreatePreviewPage(){

      },
      
      Submit(){

      }
    }
  };
  </script>
  