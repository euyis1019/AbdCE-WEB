import axios from "axios";
import authService from './services/authService';
import router from './router';

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  headers: {
    "Content-type": "application/json"
  }
});

instance.interceptors.request.use(
  (config) => {
    const user = authService.getCurrentUser();
    if (user && user.access) {
      config.headers["Authorization"] = 'Bearer ' + user.access;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    if (err.response) {
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;
        try {
          const rs = await authService.refreshToken();
          const { access } = rs;
          authService.updateLocalAccessToken(access);
          instance.defaults.headers.common["Authorization"] = "Bearer " + access;
          return instance(originalConfig);
        } catch (_error) {
          authService.logout();
          router.push('/login');
          return Promise.reject(_error);
        }
      }
    }
    return Promise.reject(err);
  }
);

export default instance;