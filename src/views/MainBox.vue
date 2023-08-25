<template>
    <div>
        <el-button type="info" @click="handleClick">申请记录</el-button>
    </div>
    <div>
        <el-button type="info" @click="handleClick1" round>提交申请</el-button>
    </div>
    <RouterView></RouterView>
</template>


<script>
export default {
    methods: {
        handleClick() {
            this.$router.push('/Record')
        },
        handleClick1() {
            this.$router.push('/Report')
        },
    }
}
</script>
