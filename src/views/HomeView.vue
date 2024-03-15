<template>
  <div>
    <h1>个人信息展示</h1>
    <el-card class="box-card">
      <div slot="header">基本信息</div>
      <p>姓名: {{ fullName }}</p>
      <p>班级: {{ classr }}</p>
      <p>学号: {{ studentId }}</p>
    </el-card>
    <el-card class="box-card">
      <div slot="header">目前的分数</div>
      <p>分数1: {{ score1 }}</p>
      <p>分数2: {{ score2 }}</p>
    </el-card>
  </div>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>进度</span>
        <el-button class="button" text>Operation button</el-button>
      </div>
    </template>
    <div v-for="o in 4" :key="o" class="text item">
      <div>{{ 'List item ' + o }}</div>
      <el-button>can can word</el-button>
    </div>
  </el-card>
</template>

<script setup>

const fullName = '张三';
const classr = 114;
const studentId = '男';
const score1 = 114514;
const score2 = '一九一九八一零';
</script>

<style>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.box-card {
  width: 480px;
}
</style>
