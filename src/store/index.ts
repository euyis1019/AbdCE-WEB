import { createStore } from 'vuex'

export default createStore({
  state: {
    isGetterRouter:false,
    userinfo:{}
  },
  getters: {
  },
  mutations: {   
    changeGetterRouter(state:any,value:any){
      state.isGetterRouter = value 
    },
    changeUserInfo(state:any,value:any) {
      //没啥必要了 保存旧的用户信息的情况下添加新的用户信息
      state.userinfo = {
        ...state.userinfo,
        ...value
      }
    },
    clearUserInfo(state:any,value:any) {// 清除用户数据
      state.userinfo = {}
    }
  },
  actions: {
  },
  modules: {
  }
})
