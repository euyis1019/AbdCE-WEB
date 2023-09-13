<template>
    <div>
      <el-button @click="addRow">添加行</el-button>
      <el-table :data="tableData" style="width: 100%" :summary-method="getSummaries" show-summary>
        <el-table-column label="大分类" prop="category1" >
          <template #default="scope">
            <el-input v-model="scope.row.category1" />
          </template>
        </el-table-column>
        <el-table-column label="中分类" prop="category2">
          <template #default="scope">
            <el-input v-model="scope.row.category2" />
          </template>
        </el-table-column>
        <el-table-column label="小分类" prop="category3">
          <template #default="scope">
            <el-input v-model="scope.row.category3" />
          </template>
        </el-table-column>
        <el-table-column label="得分" prop="score">
          <template #default="scope">
            <el-input-number v-model="scope.row.score" :min="0" :step="1" />
          </template>
        </el-table-column>
        <el-table-column label="扣分" prop="deduction">
          <template #default="scope">
            <el-input-number v-model="scope.row.deduction" :min="0" :step="1" />
          </template>
        </el-table-column>
        <el-table-column label="材料页码" prop="pageNumber">
          <template #default="scope">
            <el-input-number v-model="scope.row.pageNumber" :min="0" :step="1" />
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作">
          <template #default="scope">
            <UploadButton>上传文件</UploadButton>
            <el-button type="danger" @click="removeRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import UploadButton from './UploadButton.vue';
  
  const tableData = ref([]); // 表格数据
  
  function getSummaries(param) {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Total';
      return;
    }
    if (index === 5) {  //材料行设置为NA
      sums[index] = 'N/A';
      return;
    }
    const values = data.map((item) => Number(item[column.property]));
    if (!values.every((value) => Number.isNaN(value))) {
      sums[index] = ` ${values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!Number.isNaN(value)) {
          return prev + curr;
        } else {
          return prev;
        }
      }, 0)}`;
    } else {
      sums[index] = 'N/A';
    }
  });

  return sums;
  }


  const addRow = () => {
    tableData.value.push({
    category1: '',
    category2: '',
    category3: '',
    score: 0,
    deduction: 0,
    pageNumber: 0,
  });
  console.log(tableData)
  };
  
  const removeRow = (index) => {
    tableData.value.splice(index,1);
  };
  </script>
  