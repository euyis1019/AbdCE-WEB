<template>
    <div class="common-layout">
        <el-container class="scnu_container">
            <el-header class="scnu_nav">
                <!-- 系统名称，logo，账户名 -->
                <div class="top_bar">
                    <img src="/public/logo.png" alt="">
                    <h1><span>综测系统</span></h1>
                    <p class="username">2021XXXXXXX 管理员</p>
                </div>
                <!-- 选择事项类型，点击事项类型筛选不同状态的事项 -->
                <el-menu 
                class="el-menu-demo "
                mode="horizontal"
                background-color="#1296DB"
                text-color="white"
                active-text-color="white">
                    <el-menu-item index="1">全部</el-menu-item>
                    <el-menu-item index="2">待处理</el-menu-item>
                    <el-menu-item index="3">已完成</el-menu-item>
                </el-menu>
            </el-header>
            <el-main class="scnu_content">
                <!-- 事项内容展示 -->
                <el-table :data="tableData" stripe>
                    <el-table-column prop="index" label="序号" width="105" />
                    <el-table-column prop="date" label="日期" width="210" />
                    <el-table-column prop="grade" label="年级" width="110" />
                    <el-table-column prop="class" label="班级" width="140" />
                    <el-table-column prop="number" label="学号" width="190"/>
                    <el-table-column prop="name" label="姓名" width="140" />
                    <el-table-column prop="state" label="状态" width="140">
                        <template #default="scope">
                            <el-tag
                            :type="scope.row.state === '待处理' ? '' : 'success'"
                            disable-transitions
                            >{{ scope.row.state }}</el-tag
                            >
                        </template>
                    </el-table-column>
                </el-table>
            </el-main>
            <!-- 翻页 -->
            <div class="demo-pagination-block">
                <el-pagination
                v-model:current-page="currentPage4"
                v-model:page-size="pageSize4"
                :page-sizes="[100, 200, 300, 400]"
                :small="small"
                :disabled="disabled"
                :background="background"
                layout="total, sizes, prev, pager, next, jumper"
                :total="400"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                />
            </div>
        </el-container>
    </div>
</template>

<style src="./ApplicationRecord.css"></style>

<script>
    export default {
        data() {
            return {
                // 以下为示例数据
                tableData: [
                    {
                        index: 1,
                        date: '2015-05-03',
                        grade:'2021',
                        class: '软工1班',
                        number: '20210000000',
                        name: '安核桃',
                        state: '已完成',
                    },
                    {
                        index: 1,
                        date: '2016-05-03',
                        name: '安花生',
                        grade:'2021',
                        class: '软工1班',
                        number: '20210000000',
                        state: '待处理',
                    },
                    {
                        index: 1,
                        date: '2016-05-03',
                        grade:'2021',
                        name: '安玉米',
                        class: '软工1班',
                        state: '已完成',
                        number: '20210000000'
                    },
                    {
                        index: 1,
                        date: '2016-05-03',
                        name: '安包子',
                        grade:'2021',
                        class: '软工1班',
                        state: '已完成',
                        number: '20210000000'
                    },
                    {
                        index: 1,
                        grade:'2021',
                        date: '2016-05-03',
                        class: '软工1班',
                        state: '已完成',
                        number: '20210000000',
                        name: '安核桃',
                    },
                    {
                        index: 1,
                        date: '2016-05-03',
                        name: '安花生',
                        grade:'2021',
                        state: '待处理',
                        class: '软工1班',
                        number: '20210000000'
                    },
                    {
                        index: 1,
                        date: '2015-05-03',
                        grade:'2021',
                        name: '安玉米',
                        state: '待处理',
                        class: '软工1班',
                        number: '20210000000'
                    },
                    {
                        index: 1,
                        grade:'2021',
                        state: '待处理',
                        date: '2016-05-03',
                        name: '安包子',
                        class: '软工1班',
                        number: '20210000000'
                    },
                    {
                        index: 1,
                        date: '2016-05-03',
                        name: '安玉米',
                        state: '待处理',
                        grade:'2021',
                        class: '软工1班',
                        number: '20210000000'
                    },
                    {
                        index: 1,
                        date: '2016-05-03',
                        grade:'2021',
                        state: '待处理',
                        name: '安包子',
                        class: '软工1班',
                        number: '20210000000'
                    },
                ]
            };
        }
    };
</script>



