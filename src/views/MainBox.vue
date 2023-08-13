<template>
    <div>
        <button @click="handleClick">申请记录</button>
    </div>
    <div>
        <button @click="handleClick1">提交申请</button>
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