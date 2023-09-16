<template>
    <!-- 表格1 - 思品 -->
    <div class="table-title">思品</div>
    <el-table :data="moralityData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>
    

    <div class="table-title">学业</div>
    <el-table :data="academicData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <div class="table-title">体育</div>
    <el-table :data="physicalData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <div class="table-title">美育</div>
    <el-table :data="artData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <div class="table-title">劳动</div>
    <el-table :data="laborData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <button @click="fetchTableData">加载表格数据</button>
    
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios'; 

const moralityData = ref(null);
const academicData = ref(null);
const physicalData = ref(null);
const artData = ref(null);
const laborData = ref(null);
const uuid = '246e99b3-6802-40e3-b4b1-df9a068d4b82'


// 从后端获取表格数据
const fetchTableData = () => {
  axios.get("http://10.252.128.12:6443"+'/admin/getCE'+'?t=495b0360-b47a-41b9-9f7f-3c693c143b57&ID=20223800000&uuid='+uuid) 
    .then(response => {
      const data = response.data;
      console.log(data);
    //   // 提取各表格的数据
    //   const moralityJson = JSON.parse(data.morality);
    //   const academicJson = JSON.parse(data.academic);
    //   const physicalJson = JSON.parse(data.physical);
    //   const artJson = JSON.parse(data.art);
    //   const laborJson = JSON.parse(data.labor);

    // // 更新表格数据
    //   moralityData.value = moralityJson;
    //   academicData.value = academicJson;
    //   physicalData.value = physicalJson;
    //   artData.value = artJson;
    //   laborData.value = laborJson;
      moralityData.value = Array.isArray(data.morality) ? data.morality : [];
      academicData.value = Array.isArray(data.academic) ? data.academic : [];
      physicalData.value = Array.isArray(data.physical) ? data.physical : [];
      artData.value = Array.isArray(data.art) ? data.art : [];
      laborData.value = Array.isArray(data.labor.value) ? data.labor : [];
      console.log('data.labor='+data.labor.value)
      console.log(laborData)

    })
    .catch(error => {
      console.error('获取数据失败', error);
    });
};



// onMounted(() => {
//   // 在组件挂载后获取后端数据
//   fetchTableData();
// });
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