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
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = Cookies.get('jwt_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = 'Bearer ' + token;
    }

    // 获取当前用户ID
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.ID) {
      // 添加 userID 到 URL 参数
      config.params = config.params || {};
      if (!config.params.userID) {
        config.params.userID = currentUser.ID;
      }

      // 保留载荷中原有的 userID（如果存在）
      if (config.data) {
        if (config.data instanceof FormData) {
          // FormData 不做改变
        } else if (typeof config.data === 'string') {
          try {
            let data = JSON.parse(config.data);
            config.data = JSON.stringify(data);
          } catch (e) {
            // 如果解析失败，保持原样
          }
        } else if (typeof config.data === 'object') {
          // 对象类型，保持原样
        }
      }
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