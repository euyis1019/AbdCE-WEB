import axios from "axios";
import authService from './services/authService'; // 引入 authService

// 创建 axios 实例
const instance = axios.create({
  baseURL: "127.0.0.1:6443", // 设置 API 的基础 URL
  headers: {
    "Content-type": "application/json" // 设置默认请求头
  }
});

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 获取当前用户信息
    const user = authService.getCurrentUser(); 
    // 如果用户信息存在并且包含访问令牌
    if (user && user.access) {
      // 将访问令牌添加到请求头中
      config.headers["Authorization"] = 'Bearer ' + user.access; 
    }
    // 返回配置对象
    return config; 
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error); 
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  (res) => {
    // 处理成功响应
    return res; 
  },
  async (err) => {
    // 处理错误响应
    const originalConfig = err.config; // 获取原始请求配置对象

    // 如果响应存在
    if (err.response) {
      // 访问令牌过期
      if (err.response.status === 401 && !originalConfig._retry) { 
        // 设置 _retry 标识，防止无限循环
        originalConfig._retry = true; 

        try {
          // 尝试刷新令牌
          const rs = await authService.refreshToken(); 
          // 获取新的访问令牌
          const { access } = rs.data; 

          // 更新本地存储中的访问令牌
          authService.updateLocalAccessToken(access); 
          // 更新 axios 实例的默认请求头
          instance.defaults.headers.common["Authorization"] = "Bearer " + access; 

          // 使用新的访问令牌重新发送请求
          return instance(originalConfig); 
        } catch (_error) {
          // 处理刷新令牌失败的错误
          return Promise.reject(_error); 
        }
      }
    }

    // 处理其他错误
    return Promise.reject(err); 
  }
);

// 导出 axios 实例，供其他模块使用
export default instance; 