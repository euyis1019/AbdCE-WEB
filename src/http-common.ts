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
      // 处理不同类型的请求数据
      if (config.data instanceof FormData) {
        // 如果是 FormData，直接添加字段
        if (!config.data.has('userID')) {
          config.data.append('userID', currentUser.ID);
        }
      } else if (typeof config.data === 'string') {
        // 如果是字符串（可能是 JSON 字符串），先解析它
        try {
          let data = JSON.parse(config.data);
          if (!data.userID) {
            data.userID = currentUser.ID;
            config.data = JSON.stringify(data);
          }
        } catch (e) {
          // 如果解析失败，创建一个新的对象
          config.data = JSON.stringify({ userID: currentUser.ID });
        }
      } else if (config.data === undefined || config.data === null) {
        // 如果没有数据，创建一个新的对象
        config.data = { userID: currentUser.ID };
      } else if (typeof config.data === 'object') {
        // 如果是对象，直接添加字段
        if (!config.data.userID) {
          config.data.userID = currentUser.ID;
        }
      }

      // 对于 GET 和 DELETE 请求，确保 data 被发送
      if (config.method && ['get', 'delete'].includes(config.method.toLowerCase())) {
        config.headers = config.headers || {};
        config.headers['Content-Type'] = 'application/json';
        if (typeof config.data === 'object') {
          config.data = JSON.stringify(config.data);
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