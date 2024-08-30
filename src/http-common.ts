import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";
import authService from './services/authService';

interface DecodedToken {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  username: string;
  name: string;
}

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

      try {
        const decodedToken = jwtDecode(token) as DecodedToken;
        const userID = decodedToken.username; // 使用 username 作为 userID

        // 添加 userID 到 URL 参数
        config.params = config.params || {};
        if (!config.params.userID) {
          config.params.userID = userID;
        }

        // 如果是 FormData，追加 userID
        if (config.data instanceof FormData) {
          if (!config.data.has('userID')) {
            config.data.append('userID', userID);
          }
        } else if (typeof config.data === 'object' && config.data !== null) {
          // 对于 JSON 数据，添加 userID
          if (!config.data.userID) {
            config.data.userID = userID;
          }
        }

        // 检查 token 是否即将过期
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = decodedToken.exp;
        const refreshThreshold = 5 * 60; // 5 minutes before expiration

        if (expirationTime - currentTime < refreshThreshold) {
          // Token is about to expire, refresh it
          const newToken = await authService.refreshToken();
          if (newToken) {
            config.headers["Authorization"] = 'Bearer ' + newToken;
          }
        }
      } catch (error) {
        console.error('解析 JWT 时出错:', error);
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
        console.error('Token refresh failed:', refreshError);
        // 可能需要在这里处理登出逻辑
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;