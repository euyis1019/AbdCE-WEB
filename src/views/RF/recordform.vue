/* 
main.js:
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
*/

<template>
  <div>
    <div class="form-item">
      <div class="form-item-row">
        <div class="input-wrapper">
          <label>姓名：</label>
          <el-input v-model="info.name" size="small"></el-input>
        </div>

        <div class="input-wrapper">
          <label>班级：</label>
          <el-input v-model="info.class" size="small"></el-input>
        </div>

        <div class="input-wrapper">
          <label>学号：</label>
          <el-input v-model="info.studentId" size="small"></el-input>
        </div>
      </div>
    </div>


    <h2>思想品德模块</h2>
    <el-button @click="addMoralValue">添加项目</el-button>
    <el-button @click="removeMoralValue(index)">删除项目</el-button>
    <el-button @click="saveForm">保存</el-button>
    <el-button @click="loadForm">加载暂存数据</el-button>


    <el-table :data="moralValues">
      <el-table-column label="初始序号">
        <template #default="{ $index }">
          <div class="index-cell">{{ $index + 1 }}</div>
        </template>
      </el-table-column>
      <el-table-column label="项目（大分类）">
        <template #default="{ row }">
          <el-input v-model="row.category"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="项目（小分类）">
        <template #default="{ row }">
          <el-input v-model="row.subcategory"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="项目（子分类）">
        <template #default="{ row }">
          <el-input v-model="row.subsubcategory"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="得分">
        <template #default="{ row }">
          <el-input-number v-model="row.score" :min="0" :max="100"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="扣分">
        <template #default="{ row }">
          <el-input-number v-model="row.deduction" :min="0" :max="100"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="材料页码">
        <template #default="{ row }">
          <el-input-number v-model="row.page" :min="1"></el-input-number>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      info: {
        name: "",
        class: "",
        studentId: ""
      },
      moralValues: [],
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
    removeMoralValue(index) {
      this.moralValues.splice(index, 1);
    },

    saveForm() {
      const formData = {
        info: this.info,
        moralValues: this.moralValues
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
        alert("暂存数据已加载");
      } else {
        alert("没有暂存数据");
      }
    }
  }
};
</script>
<style>
.form-item-row {
  text-align: center;
}

.input-wrapper {
  display: inline-block;
  margin-right: 10px;
  text-align: left;
}

.input-wrapper label {
  white-space: nowrap;
  margin-right: 6px;
}

.defaultNum{
  width:10px;
}

.index-cell {
  width: 50px; /* 调整初始序号框框的宽度 */
  height: 30px; /* 调整初始序号框框的高度 */
  line-height: 30px; /* 调整初始序号框框中文字的垂直居中 */
  background-color: #eee;
  border-radius: 4px;
  text-align: center; /* 调整初始序号框框中文字的水平居中 */
}

</style>