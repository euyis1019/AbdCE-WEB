import axios from "axios";
import Cookies from 'js-cookie';
import authService from './services/authService';

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  headers: {
    "Content-type": "application/json"
  }
});

instance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt_token');
    if (token) {
      config.headers["Authorization"] = 'Bearer ' + token;
    }

    // 获取当前用户ID
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.ID) {
      // 确保 params 对象存在
      config.params = config.params || {};
      
      // 如果 userID 不存在，则添加它
      if (!config.params.userID) {
        config.params.userID = currentUser.ID;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await authService.refreshToken();
        if (newToken) {
          axios.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          return instance(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;