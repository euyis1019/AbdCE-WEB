<template>
    <el-row class="tac">
        <el-col :span="3">
            <h1>导航条</h1>
            <el-menu>
                <el-menu-item index="1" @click="handleClick">
                    <i class="el-icon-menu"></i>
                    <span slot="title">申请记录</span>
                </el-menu-item>
                <el-menu-item index="2" @click="handleClick1">
                    <i class="el-icon-setting"></i>
                    <span slot="title">提交申请</span>
                </el-menu-item>
            </el-menu>
        </el-col>
    </el-row>

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
        handleOpen(key, keyPath) {
            console.log(key, keyPath);
        },
        handleClose(key, keyPath) {
            console.log(key, keyPath);
        },
    }
}
</script>
