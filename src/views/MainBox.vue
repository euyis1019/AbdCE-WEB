<template>
    <div>
        <button @click="handleClick">申请记录</button>
    </div>
    <div>
        <button @click="handleClick1">提交申请</button>
    </div>
</template>


<script>
export default {
    methods: {
        handleClick() {
            this.$router.push('/record')
        },
        handleClick1() {
            this.$router.push('/apply')
        },
    }
}
</script>