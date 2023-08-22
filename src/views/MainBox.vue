<<<<<<< HEAD
//Student MainBox
<template>
    <div> 
        <div>ApplicationRecord</div>
        <div>ReportForm</div>

        <RouterView></RouterView>
    </div>
</template>
=======
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
>>>>>>> 72880bef85b562ecd0cba657eadb97c22e6dc6aa
