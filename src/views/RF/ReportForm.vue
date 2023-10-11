<template>
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
    
     <div class="app">
    <!-- 表格1 - 思品 -->
    <div class="table-title">思品</div>
    <el-button @click="addRow1">添加行</el-button>
    <el-table :data="tableData1" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass">
        <template #default="scope">
          <el-input v-model="scope.row.Lclass" />
        </template>
      </el-table-column>
      <el-table-column label="中分类" prop="Mclass">
        <template #default="scope">
          <el-input v-model="scope.row.Mlcass" />
        </template>
      </el-table-column>
      <el-table-column label="小分类" prop="Sclass">
        <template #default="scope">
          <el-input v-model="scope.row.Sclass" />
        </template>
      </el-table-column>
      <el-table-column label="材料页码" prop="Page">
        <template #default="scope">
          <el-input-number v-model="scope.row.Page" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="得分" prop="Point">
        <template #default="scope">
          <el-input-number v-model="scope.row.Point" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="操作" prop="FileDst">
        <template #default="scope">
            <UploadButton 
        @file-uploaded="fileUrl => handleFileUploaded(1, scope.$index, fileUrl)">上传文件</UploadButton>
          <el-button type="danger" @click="removeRow(1, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="table-title">学业</div>
    <el-button @click="addRow2">添加行</el-button>
    <el-table :data="tableData2" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass">
        <template #default="scope">
          <el-input v-model="scope.row.Lclass" />
        </template>
      </el-table-column>
      <el-table-column label="中分类" prop="Mclass">
        <template #default="scope">
          <el-input v-model="scope.row.Mlcass" />
        </template>
      </el-table-column>
      <el-table-column label="小分类" prop="Sclass">
        <template #default="scope">
          <el-input v-model="scope.row.Sclass" />
        </template>
      </el-table-column>
      <el-table-column label="材料页码" prop="Page">
        <template #default="scope">
          <el-input-number v-model="scope.row.Page" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="得分" prop="Point">
        <template #default="scope">
          <el-input-number v-model="scope.row.Point" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="操作" prop="FileDst">
        <template #default="scope">
            <UploadButton 
        @file-uploaded="fileUrl => handleFileUploaded(2, scope.$index, fileUrl)">上传文件</UploadButton>
          <el-button type="danger" @click="removeRow(2, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-title">体育</div>
    <el-button @click="addRow3">添加行</el-button>
    <el-table :data="tableData3" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass">
        <template #default="scope">
          <el-input v-model="scope.row.Lclass" />
        </template>
      </el-table-column>
      <el-table-column label="中分类" prop="Mclass">
        <template #default="scope">
          <el-input v-model="scope.row.Mlcass" />
        </template>
      </el-table-column>
      <el-table-column label="小分类" prop="Sclass">
        <template #default="scope">
          <el-input v-model="scope.row.Sclass" />
        </template>
      </el-table-column>
      <el-table-column label="材料页码" prop="Page">
        <template #default="scope">
          <el-input-number v-model="scope.row.Page" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="得分" prop="Point">
        <template #default="scope">
          <el-input-number v-model="scope.row.Point" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="操作" prop="FileDst">
        <template #default="scope">
            <UploadButton 
        @file-uploaded="fileUrl => handleFileUploaded(3, scope.$index, fileUrl)">上传文件</UploadButton>
          <el-button type="danger" @click="removeRow(3, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-title">美育</div>
    <el-button @click="addRow4">添加行</el-button>
    <el-table :data="tableData4" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass">
        <template #default="scope">
          <el-input v-model="scope.row.Lclass" />
        </template>
      </el-table-column>
      <el-table-column label="中分类" prop="Mclass">
        <template #default="scope">
          <el-input v-model="scope.row.Mlcass" />
        </template>
      </el-table-column>
      <el-table-column label="小分类" prop="Sclass">
        <template #default="scope">
          <el-input v-model="scope.row.Sclass" />
        </template>
      </el-table-column>
      <el-table-column label="材料页码" prop="Page">
        <template #default="scope">
          <el-input-number v-model="scope.row.Page" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="得分" prop="Point">
        <template #default="scope">
          <el-input-number v-model="scope.row.Point" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="操作" prop='FileDst'>
        <template #default="scope">
            <UploadButton 
        @file-uploaded="fileUrl => handleFileUploaded(4,scope.$index, fileUrl)">上传文件</UploadButton>
          <el-button type="danger" @click="removeRow(4, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-title">劳动</div>
    <el-button @click="addRow5">添加行</el-button>
    <el-table :data="tableData5" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass">
        <template #default="scope">
          <el-input v-model="scope.row.Lclass" />
        </template>
      </el-table-column>
      <el-table-column label="中分类" prop="Mclass">
        <template #default="scope">
          <el-input v-model="scope.row.Mlcass" />
        </template>
      </el-table-column>
      <el-table-column label="小分类" prop="Sclass">
        <template #default="scope">
          <el-input v-model="scope.row.Sclass" />
        </template>
      </el-table-column>
      <el-table-column label="材料页码" prop="Page">
        <template #default="scope">
          <el-input-number v-model="scope.row.Page" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="得分" prop="Point">
        <template #default="scope">
          <el-input-number v-model="scope.row.Point" :min="0" :step="1" />
        </template>
      </el-table-column>
      <el-table-column label="操作" prop="FileDst">
        <template #default="scope">
            <UploadButton 
        @file-uploaded="fileUrl => handleFileUploaded(5,scope.$index, fileUrl)">上传文件</UploadButton>
          <el-button type="danger" @click="removeRow(5, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 总表格 -->
    <div class="total-table">
      <el-table :data="totalData" style="width: 100%">
        <el-table-column label="项目" prop="title" width="100"></el-table-column>
        <el-table-column label="总得分" prop="totalScore" width="100"></el-table-column>
      </el-table>
    </div>
  </div>
  
    <el-form-item>
      <!--提交按钮-->
      <el-button type="primary" @click="submitForm()">提交</el-button>
    </el-form-item>
    
</template>

<script setup>
import axios from 'axios';
import { reactive } from 'vue'
import { ref, computed,inject } from 'vue';
import UploadButton from './UploadButton.vue';
//info用于储存学生基本信息
const info = reactive({
  name: "",
  class: "",
  studentId: ""
});
// 获取本地存储的学号
const id = localStorage.getItem("ID")
// const baseURL = inject('baseURL');
const submitForm = () => {
  // MoralityTable.value = extractColumnsData(tableData1.value);
  // AcademicTable.value = extractColumnsData(tableData2.value);
  // PhysicalTable.value = extractColumnsData(tableData3.value);
  // ArtTable.value = extractColumnsData(tableData4.value);
  // LaborTable.value = extractColumnsData(tableData5.value);
  const atoken = localStorage.getItem("token")
  const Cls = localStorage.getItem('Class')
  const url = "http://10.252.128.12:6443"+'/report/new'+'?t='+atoken+'&ID='+id+'&class='+Cls;
  const data = {    
    userID: info.studentId,
    uuid:"",
    morality:tableData1,
    academic:tableData2,
    physical:tableData3,
    art:tableData4,
    labor:tableData5,  
  };
  console.log(data)
  axios.post(url, data)
      .then(response => {
          console.log('Success:', response.data);
          alert('提交成功');
      })
      .catch(error => {
          console.error('Error:', error);
          alert('提交失败，请联系管理员')
      });
}
// const sendGetRequest = () => {
//     const url = 'http://14.155.175.41:1443/login';
//     const params = {
//         ID: "20223800000",
//         pass: "456123"
//     };
//     console.log("131")
//     axios.get(url, { params: params })
//         .then(response => {
//             console.log('Success:', response.data);
//             if (response.data && response.data.msg) {
//                 console.log('Received token:', response.data.msg);
//             } else {
//                 console.log('Token not found in response.');
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }
// 表格1 - 思品
const tableData1 = ref([
  // 初始数据行
]);
// 表格2 - 学业
const tableData2 = ref([
  // 初始数据行
]);
// 表格3 - 体育
const tableData3 = ref([
  // 初始数据行
]);
// 表格4 - 美育
const tableData4 = ref([
  // 初始数据行
]);
// 表格5 - 劳动
const tableData5 = ref([
  // 初始数据行
]);
// 计算总得分和总扣分
const getTotalScore = (data) => {
  return data.reduce((total, row) => total + row.Point, 0);
};
// const getTotalDeduction = (data) => {
//   return data.reduce((total, row) => total + row.deduction, 0);
// };
//合计数据，用于传参
const MoralityTable =ref({});
const AcademicTable = ref({});
const PhysicalTable = ref({});
const ArtTable = ref({});
const LaborTable = ref({});
const totalSumData = reactive({
  moralitySum: 0,
  academicSum: 0,
  physicalSum:0,
  artSum:0,
  laborSum:0,
});
//合计数据表格的data
const totalData = computed(() => {
  return [
  { title: '思品', totalScore: getTotalScore(tableData1.value)},
  { title: '学业', totalScore: getTotalScore(tableData2.value)},
  { title: '体育', totalScore: getTotalScore(tableData3.value)},
  { title: '美育', totalScore: getTotalScore(tableData4.value)},
  { title: '劳动', totalScore: getTotalScore(tableData5.value)},
]});
const extractColumnsData = (data) => {
  const columnData = {};
  for (const column of Object.keys(data[0])) {
    columnData[column] = data.map(item => item[column]);
  }
  return columnData
};
// 添加行
const addRow1 = () => {
  tableData1.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: '',
  });
};
const addRow2 = () => {
  tableData2.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: '',
  });
};
const addRow3 = () => {
  tableData3.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: '',
  });
};
const addRow4 = () => {
  tableData4.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: '',
  });
};
const addRow5 = () => {
  tableData5.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: '',
  });
};
// 删除行
const removeRow = (tableIndex, rowIndex) => {
  switch (tableIndex) {
    case 1:
      tableData1.value.splice(rowIndex, 1);
      break;
    case 2:
      tableData2.value.splice(rowIndex, 1);
      break;
    case 3:
      tableData3.value.splice(rowIndex, 1);
      break;
    case 4:
      tableData4.value.splice(rowIndex, 1);
      break;
    case 5:
      tableData5.value.splice(rowIndex, 1);
      break;
  }
};
const handleFileUploaded = (tableIndex,rowIndex, fileUrl) => {
  switch (tableIndex) {
    case 1:
      tableData1.value[rowIndex].FileDst = fileUrl;
      break;
    case 2:
      tableData2.value[rowIndex].FileDst = fileUrl;
      break;
    case 3:
      tableData3.value[rowIndex].FileDst = fileUrl;
      break;
    case 4:
      tableData4.value[rowIndex].FileDst = fileUrl;
      break;
    case 5:
      tableData5.value[rowIndex].FileDst = fileUrl;
      break;
    default:
      // 处理未知的表格索引
      break;
  }
};
</script>

<style lang="scss" scoped>
#hello {position: relative;}
#contextmenu {
  position:absolute;
  top: 0;
  left: 0;
  height:auto;
  width:120px;
  border-radius: 3px;
  border: 1px solid #999999;
  background-color: #f4f4f4;
  padding: 10px;
  z-index: 12;
  button {display:block;margin:0 0 5px;}
}
.app {
  margin: 20px;
  font-family: Arial, sans-serif;
}
.total {
  margin-top: 10px;
  text-align: right;
  font-weight: bold;
}
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
</style>