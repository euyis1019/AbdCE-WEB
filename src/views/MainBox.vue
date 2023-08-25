<template>
    <div>
        <el-button type="info" @click="handleClick">申请记录</el-button>
    </div>
    <div>
        <el-button type="info" @click="handleClick1" round>提交申请</el-button>
    </div>
    <RouterView></RouterView>
</template>



<script setup>
const handleClick = () => {
    router.push("/Record")
};
const handleClick1 = () => {
    router.push("/Record")
};
</script>
