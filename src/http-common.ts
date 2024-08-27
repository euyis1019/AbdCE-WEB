
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import Cookies from 'js-cookie';
import authService from './services/authService';

const instance: AxiosInstance = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  headers: {
    "Content-type": "application/json"
  }
});

instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const token = Cookies.get('jwt_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = 'Bearer ' + token;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser && currentUser.ID) {
        // 添加 userID 到 URL 参数
        config.params = config.params || {};
        if (!config.params.userID) {
          config.params.userID = currentUser.ID;
        }

        // 如果是 FormData，追加 userID
        if (config.data instanceof FormData) {
          if (!config.data.has('userID')) {
            config.data.append('userID', currentUser.ID);
          }
        } else if (typeof config.data === 'object' && config.data !== null) {
          // 对于 JSON 数据，添加 userID（如不存在）
          if (!config.data.userID) {
            config.data.userID = currentUser.ID;
          }
        }
      }
    } catch (error) {
      console.error('获取当前用户出错:', error);
    }

    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | AxiosError> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
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