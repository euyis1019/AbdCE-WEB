<template>
    <div class="permission-management">
      <h1 class="page-title">
        权限管理
        <i class="el-icon-success status-icon finished" v-if="isAllAssigned"></i>
        <i class="el-icon-warning status-icon pending" v-else></i>
      </h1>
  
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="box-card">
            <div slot="header" class="clearfix">选择分类</div>
            <el-cascader
              v-model="selectedOptions"
              :options="categoryOptions"
              :props="optionsProps"
              @change="onOptionsChange"
              placeholder="请选择分类">
            </el-cascader>
          </el-card>
        </el-col>
        
        <el-col :span="16">
          <el-card v-if="selectedBranch" class="box-card">
            <div slot="header" class="clearfix">分配任务</div>
            <el-form ref="form" :model="form" label-width="120px">
              <el-form-item label="管理员" prop="manager" :rules="managerRules">
                <el-select v-model="form.manager" placeholder="选择一个管理员" filterable>
                  <el-option v-for="manager in filteredManagers()" :key="manager.id"
                    :label="manager.name" :value="manager.id">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitForm">提交</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
      
      <transition name="el-fade-in">
        <el-card v-if="showAlert" class="alert-card">
          <el-alert title="提交成功" type="success" show-icon>
            权限数据已成功提交!
          </el-alert>
        </el-card>
      </transition>
      
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
// 鬼知道后端接口会怎么写，这些接口都是假的

// 填充默认数据用于测试

export default {
  data() {
    return {
      categoryOptions: [
        {
          id: 1,
          name: '分类1',
          children: [
            {
              id: 11,
              name: '子分类1-1',
              children: [
                { id: 111, name: '分支1-1-1', manager: null },
                { id: 112, name: '分支1-1-2', manager: { id: 1, name: '经理A' } }
              ]
            },
            {
              id: 12,
              name: '子分类1-2',
              children: [
                { id: 121, name: '分支1-2-1', manager: { id: 2, name: '经理B' } },
                { id: 122, name: '分支1-2-2', manager: null }
              ]
            }
          ]
        },
        {
          id: 2,
          name: '分类2',
          children: [
            {
              id: 21,
              name: '子分类2-1',
              children: [
                { id: 211, name: '分支2-1-1', manager: null },
                { id: 212, name: '分支2-1-2', manager: { id: 3, name: '经理C' } }
              ]
            },
            {
              id: 22,
              name: '子分类2-2',
              children: [
                { id: 221, name: '分支2-2-1', manager: null },
                { id: 222, name: '分支2-2-2', manager: null }
              ]
            }
          ]
        }
      ],
      optionsProps: {
        value: 'id',
        label: 'name',
        children: 'children'
      },
      selectedOptions: [],
      selectedBranch: null,
      managers: [
        { id: 1, name: '经理A' },
        { id: 2, name: '经理B' },
        { id: 3, name: '经理C' },
        { id: 4, name: '经理D' }
      ],
      form: {
        manager: ''
      },
      managerRules: [
        { required: true, message: '请选择一个经理', trigger: 'change' }
      ],
      showAlert: false
    }
  },
  computed: {
    isAllAssigned() {
      return this.categoryOptions.every(cat =>
        cat.children.every(sub =>
          sub.children.every(branch => branch.manager)
        )
      )
    }
  },
  methods: {
    async onOptionsChange(value) {
      this.selectedBranch = null
      if (value && value.length === 3) {
        const branchId = value[2]
        this.selectedBranch = this.categoryOptions
          .find(cat => cat.id == value[0]).children
          .find(sub => sub.id == value[1]).children
          .find(branch => branch.id == branchId)

        // 模拟从后端获取经理数据
        // this.managers = await this.getManagersFromApi(branchId)
      }
      this.form.manager = ''
    },
    // async getManagersFromApi(branchId) {
    //   try {
    //     let res = await axios.get(`/api/managers?branchId=${branchId}`)
    //     return res.data
    //   } catch (err) {
    //     console.error(err)
    //     return []
    //   }
    // },
    async submitForm() {
      try {
        await this.$refs.form.validate()
        let params = {
          branchId: this.selectedBranch.id,
          managerId: this.form.manager
        }
        // let result = await this.assignManagerFromApi(params)
        
        // 模拟提交成功
        let result = { success: true }
        
        if (result.success) {
          this.showAlert = true
          setTimeout(() => {
            this.showAlert = false
          }, 3000)
          this.selectedOptions = []
          this.form.manager = ''
          this.$refs.form.resetFields()
          // await this.getCategoryOptions()
        } else {
          this.$message.error(result.errMsg)
        }
      } catch (err) {
        console.error(err)
      }
    },
    // async assignManagerFromApi(params) {
    //   try {
    //     let res = await axios.post('/api/assignManager', params)
    //     return res.data
    //   } catch (err) {
    //     console.error(err)
    //     return { success: false, errMsg: '服务器错误' }
    //   }
    // },
    filteredManagers() {
      return this.managers.filter(m => m.id != this.form.manager)
    }
  }
  // created() {
  //   this.getCategoryOptions()
  // }
}
</script>


  
  <style scoped>
  .page-title {
    color: #42b983;
    text-align: center;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 600; 
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .status-icon {
    font-size: 20px;
    margin-left: 6px;
  }  
  .status-icon.finished {
    color: #67c23a;
  }
  .status-icon.pending {
    color: #e6a23c;  
  }
  .box-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .box-card .el-card__body {
    flex: 1;
    overflow: auto;
  }
  .el-cascader {
    width: 100%;
  }
  .alert-card {
    margin-top: 20px;
  }
  </style>