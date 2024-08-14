import axios from 'axios';

// 设置 API 的基础 URL
const API_URL = 'http://your-api-url.com/api/'; 

// 定义 authService 对象，包含所有与 JWT 相关的操作
const authService = {
  // 登录方法，接收用户名和密码作为参数
  login: async (username, password) => {
    // 发送 POST 请求到 /api/token_obtain/ 端点，获取访问令牌和刷新令牌
    const response = await axios.post(API_URL + 'token_obtain/', { username, password });
    // 如果获取到访问令牌
    if (response.data.access) {
      // 将用户数据（包含访问令牌和刷新令牌）保存到本地存储
      localStorage.setItem('user', JSON.stringify(response.data)); 
    }
    // 返回响应数据
    return response.data; 
  },

  // 注销方法，从本地存储中移除用户数据
  logout: () => {
    localStorage.removeItem('user'); 
  },

  // 获取当前用户信息，从本地存储中读取用户数据并解析为 JSON 对象
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user')); 
  },

  // 刷新令牌方法
  refreshToken: async () => {
    // 获取当前用户信息
    const user = authService.getCurrentUser(); 
    // 如果用户信息存在并且包含刷新令牌
    if (user && user.refresh) {
      // 发送 POST 请求到 /api/token_refresh/ 端点，使用刷新令牌获取新的访问令牌
      const response = await axios.post(API_URL + 'token_refresh/', { refresh: user.refresh });
      // 如果获取到新的访问令牌
      if (response.data.access) {
        // 更新本地存储中的访问令牌
        user.access = response.data.access; 
        localStorage.setItem('user', JSON.stringify(user)); 
      }
      // 返回响应数据
      return response.data; 
    }
    // 如果没有刷新令牌，返回 null
    return null; 
  },

  // 验证令牌方法，接收令牌作为参数
  verifyToken: async (token) => {
    try {
      // 发送 POST 请求到 /api/token_verify/ 端点，验证令牌的有效性
      await axios.post(API_URL + 'token_verify/', { token }); 
      // 验证成功，返回 true
      return true; 
    } catch (error) {
      // 验证失败，返回 false
      return false; 
    }
  },

  // 更新本地存储中的访问令牌
  updateLocalAccessToken: (token) => {
    let user = authService.getCurrentUser();
    user.access = token;
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// 导出 authService 对象，供其他模块使用
export default authService;