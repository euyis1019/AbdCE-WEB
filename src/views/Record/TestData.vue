<template>
  <div id="app">
    <h1>待办事项</h1>
    <div class="filter">
      <button v-for="status in statuses" :key="status" :class="{active: filter === status}" @click="filter = status">{{ status }}</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>序号</th>
          <th>日期</th>
          <th>年级</th>
          <th>班级</th>
          <th>学号</th>
          <th>姓名</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.uuid">
          <td>{{ item.uuid }}</td>
          <td>{{formatTime(item.updateTime) }}</td>
          <td>{{  }}</td>
          <td>{{  }}</td>
          <td>{{ item.userID }}</td>
          <td>{{  }}</td>
          <td>{{  }}</td>
          <td><button>编辑/审核</button></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">

      <span>当前页码：{{ page }} / {{ pageCount }}</span>
      <button v-for="n in pageCount" :key="n" :class="{active: page === n}" @click="page = n">{{ n }}</button>
      <input type="number" v-model="jumpPage" min="1" :max="pageCount" />
      <button @click="page = jumpPage">跳转</button>
    
    </div>
  </div>
</template>

  
  <script>
  import axios from "axios";
  export default {
    data() {
      return {
        data: null, // 存储后端请求的数据
      };
    },
    mounted() {
      // 获取本地存储的token
      const token = localStorage.getItem("token");
      // 获取本地存储的学号
      const id = localStorage.getItem("ID")
      // 请求后端接口
      axios
        .get("http://10.252.128.12:6443/admin/getTDList", {
          params: {
            ID: id,
            t: token,
          },
        })
        .then((res) => {
          // 将数据存储到data中
          this.data = res.data;
          console.log(this.data)
        })
        .catch((err) => {
          // 处理错误
          console.error(err);
        });
    },
    
    methods: {
        // 格式化时间
        formatTime(timestamp) {
        // 创建一个日期对象
        const date = new Date(timestamp * 1000);
        // 获取年月日时分秒
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        // 返回一个字符串
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        },
    },
  };
  </script>
  

  <style>
  /* 设置样式 */
  h1 {
    text-align: center;
  }
  .filter {
    display: flex;
    justify-content: center;
    margin: 10px;
  }
  .filter button {
    margin: 5px;
    padding: 5px 10px;
    border: 1px solid black;
    cursor: pointer;
  }
  .filter button.active {
    background-color: blue;
    color: white;
  }
  table {
    width: 80%;
    margin: 0 auto;
    border-collapse: collapse;
  }
  table th,
  table td {
    border: 1px solid black;
    padding: 5px;
    text-align: center;
  }
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px;
  }
  .pagination span {
    margin: 5px;
  }
  .pagination button {
    margin: 5px;
    padding: 5px 10px;
    border: 1px solid black;
    cursor: pointer;
  }
  .pagination button.active {
    background-color: blue;
    color: white;
  }
  .pagination input {
    width: 50px;
  }
  
  </style>
  
