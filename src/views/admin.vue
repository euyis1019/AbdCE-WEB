<template>
    <!-- 表格1 - 思品 -->
    <div class="table-title">思品</div>
    <el-table v-if="moralityData" :data="moralityData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>
    

    <div class="table-title">学业</div>
    <el-table v-if="academicData" :data="academicData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <div class="table-title">体育</div>
    <el-table v-if="physicalData" :data="physicalData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <div class="table-title">美育</div>
    <el-table v-if="artData" :data="artData" style="width: 100%">
      <el-table-column label="大分类" prop="Lclass"> </el-table-column>
      <el-table-column label="中分类" prop="Mclass"></el-table-column>
      <el-table-column label="小分类" prop="Sclass"></el-table-column>
      <el-table-column label="材料页码" prop="Page"></el-table-column>
      <el-table-column label="得分" prop="Point"></el-table-column>
      <el-table-column label="操作"></el-table-column>
    </el-table>

    <div class="table-title">劳动</div>
    <el-table v-if="laborData" :data="laborData" style="width: 100%">
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


// 从后端获取表格数据
const fetchTableData = () => {
  axios.get("http://10.252.128.12:6443"+'/api/data') 
    .then(response => {
      const data = response.data;

      // 提取各表格的数据
      moralityData.value = data.morality;
      academicData.value = data.academic;
      physicalData.value = data.physical;
      artData.value = data.art;
      laborData.value = data.labor;
      

    })
    .catch(error => {
      console.error('获取数据失败', error);
    });
};



onMounted(() => {
  // 在组件挂载后获取后端数据
  fetchTableData();
});
</script>