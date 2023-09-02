import { createStore } from 'vuex'

export default createStore({
  state: {
    isGetterRouter:false,
    userinfo:{}
  },
  getters: {
  },
  mutations: {   
    changeGetterRouter(state,value){
      state.isGetterRouter = value 
    },
    changeUserInfo(state, value) {
      // 保存旧的用户信息的情况下添加新的用户信息
      state.userInfo = {
        ...state.userInfo,
        ...value
      }
    },
    clearUserInfo(state, value) {// 清除用户数据
      state.userInfo = {}
    }
  },
  actions: {
  },
  modules: {
  }
})
