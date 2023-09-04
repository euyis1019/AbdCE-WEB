import axios from 'axios';
import router from './router';

// axios 配置
axios.defaults.timeout = 8000;
axios.defaults.baseURL = 'https://localhost:1443';
// http request 拦截器
axios.interceptors.request.use(
  config => {
    var token = window.localStorage.getItem("token")
    // console.log(token)
    if (token) { //判断token是否存在
      config.headers.Authorization = token;  //将token设置成请求头
      // console.log("token:"+config.headers.Authorization)
    }
    return config;
  },
  err => {
    return Promise.reject(err);
  }
);

// http response 拦截器
axios.interceptors.response.use(
  response => {
    if (response.data.errno === 999) {
      router.replace('/');
      console.log("token过期");
    }
    // console.log(response.data.errno)
    return response;
  },
  error => {
    return Promise.reject(error);
  }
);
export default axios;
