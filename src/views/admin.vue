<template>
    <!-- 表格1 - 思品 -->
    <div class="table-title">思品</div>
    <el-button @click="addRow1">添加行</el-button>
    <el-table :data="moralityData" style="width: 100%">
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
          <el-button
            type="primary"
            tag="a"
            :href='baseURL+scope.row.FileDst'
            target="_blank"
            rel="noopener noreferrer"
          >
            can can need
          </el-button>
          <el-button type="danger" @click="removeRow(1, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    

    <div class="table-title">学业</div>
    <el-button @click="addRow2">添加行</el-button>
    <el-table :data="academicData" style="width: 100%">
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
          <el-button
            type="primary"
            tag="a"
            :href='baseURL+scope.row.FileDst'
            target="_blank"
            rel="noopener noreferrer"
          >
            can can need
          </el-button>
          <el-button type="danger" @click="removeRow(2, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-title">体育</div>
    <el-button @click="addRow3">添加行</el-button>
    <el-table :data="physicalData" style="width: 100%">
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
          <el-button
            type="primary"
            tag="a"
            :href='baseURL+scope.row.FileDst'
            target="_blank"
            rel="noopener noreferrer"
          >
            can can need
          </el-button>
          <el-button type="danger" @click="removeRow(3, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-title">美育</div>
    <el-button @click="addRow4">添加行</el-button>
    <el-table :data="artData" style="width: 100%">
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
          <el-button
            type="primary"
            tag="a"
            :href='baseURL+scope.row.FileDst'
            target="_blank"
            rel="noopener noreferrer"
          >
            can can need
          </el-button>
          <el-button type="danger" @click="removeRow(4, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-title">劳动</div>
    <el-button @click="addRow5">添加行</el-button>
    <el-table :data="laborData" style="width: 100%">
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
          <el-button
            type="primary"
            tag="a"
            :href='baseURL+scope.row.FileDst'
            target="_blank"
            rel="noopener noreferrer"
          >
            can can need
          </el-button>
          <el-button type="danger" @click="removeRow(5, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
      <el-row class="mb-4"> 
      <el-button type="primary"  v-if="Audit1" @click="YesButton">审核完毕</el-button>
      <el-button type="primary" v-if="Audit2" @click="YesButton">审核无异议</el-button>
      <el-button type="warning" v-if="Audit2" @click="NoButton">审核有异议</el-button>
      <el-button type="primary" v-if="Audit3" @click="YesButton">已阅，同意</el-button>
      <el-button type="primary" v-if="Audit3" @click="NoButton">老子不同意</el-button>
    </el-row>

    <button @click="fetchTableData">加载表格数据</button>
    
</template>

<script setup>
import { ref, onMounted,inject,computed } from 'vue';
import axios from 'axios'; 
import { useRoute } from "vue-router";
import { defineProps } from 'vue';

// const { TID, stepID } = defineProps(['TID', 'stepID']);

const moralityData = ref(null);
const academicData = ref(null);
const physicalData = ref(null);
const artData = ref(null);
const laborData = ref(null);
const targetID = '274b129e-9ad2-4894-8025-dba3d49465dc'
const baseURL = inject('baseURL');
//获取本地储存的token
const atoken = localStorage.getItem("token");
// 获取本地存储的学号
const id = localStorage.getItem("ID");
let Audit1 = ref(false);
let Audit2 = ref(false);
let Audit3 = ref(false);



// 从后端获取表格数据
const fetchTableData = () => {

  
  
  axios.get("http://10.252.128.12:6443"+'/admin/getCE'+'?t='+atoken+'&ID='+id+'&targetID='+TID) 
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
      moralityData.value = Array.isArray(data.morality._value) ? data.morality._value : [];
      academicData.value = Array.isArray(data.academic._value) ? data.academic._value : [];
      physicalData.value = Array.isArray(data.physical._value) ? data.physical._value : [];
      artData.value = Array.isArray(data.art._value) ? data.art._value : [];
      laborData.value = Array.isArray(data.labor._value) ? data.labor._value : [];

    })
    .catch(error => {
      console.error('获取数据失败', error);
    });
};
//把数据post回去
const SubmitMethod = ()=>{
  console.log(stepID)
  const url = baseURL + '/report/audit'+'?t='+atoken+'&ID='+id+'&stepID='+stepID+'&targetID='+TID ;
  console.log(url)
  const data = {
    morality:moralityData,
    academic:academicData,
    physical:physicalData,
    art:artData,
    labor:laborData,  
  };
  console.log(data)
  axios.post(url, data)
    .then(response => {
      console.log('Success:', response.data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
};
// 删除行
const removeRow = (tableIndex, rowIndex) => {
  switch (tableIndex) {
    case 1:
      moralityData.value.splice(rowIndex, 1);
      break;
    case 2:
      academicData.value.splice(rowIndex, 1);
      break;
    case 3:
      physicalData.value.splice(rowIndex, 1);
      break;
    case 4:
      artData.value.splice(rowIndex, 1);
      break;
    case 5:
      laborData.value.splice(rowIndex, 1);
      break;
  }
};
// 添加行
const addRow1 = () => {
  moralityData.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: 0,
  });
};
const addRow2 = () => {
  academicData.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: 0,
  });
};
const addRow3 = () => {
  physicalData.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: 0,
  });
};
const addRow4 = () => {
  artData.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: 0,
  });
};
const addRow5 = () => {
  laborData.value.push({
    Lclass: '',
    Mclass: '',
    Sclass: '',
    Page: 0,
    Point: 0,
    FileDst: 0,
  });
};

// let stash = 0

const YesButton = ()=>{
  if(stepID == 0 || stepID == 1 || stepID == 3 || stepID == 7){
    stepID = parseInt(stepID)
    stepID = stepID + 1
  }
  else if(stepID == 2 || stepID == 4){
    stepID = parseInt(stepID)
    stepID = 6
  }
  else{
    stepID = parseInt(stepID)
    stepID = 7
  }
  SubmitMethod()
};

const NoButton = () =>{
  if(stepID == 1){
    stepID = parseInt(stepID)
    stepID = stepID + 2
  }
  else if (stepID == 2 || stepID == 4 || stepID == 7){
    stepID = parseInt(stepID)
    stepID = 5
  }

  SubmitMethod()
};

const route = useRoute();
//扒拉下来的stepID
let stepID = route.query.stepID;
//扒拉下来的uuid
const TID = route.query.TID;


onMounted(() => {
  console.log(TID,stepID)
  if(stepID== 0 || stepID ==3|| stepID ==5){
    Audit1.value = !Audit1.value;
    Audit2.value = Audit2.value;
  }
  else if (stepID == 1){
    Audit2.value = !Audit2.value;
    Audit1.value = Audit1.value;
  }
  else{
    Audit3.value = !Audit3.value;
  }
  // 在组件挂载后获取后端数据
  fetchTableData();
  // console.log(baseURL)
});
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