import axios from 'axios';
import jwtDecode from 'jwt-decode';

const SSO_URL = process.env.VUE_APP_SSO_URL || 'http://sso.abdn.kirisame.cc/ce/';
const DEFAULT_TOKEN_LIFETIME = 30 * 60 * 1000; // 默认令牌生命周期为30分钟
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 刷新阈值为5分钟
const MIN_REFRESH_INTERVAL = 60 * 1000; // 最小刷新间隔为1分钟

const authService = {
  getTokenExpiration: (token) => {
    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp) {
        return decodedToken.exp * 1000; // 转换为毫秒
      }
    } catch (error) {
      console.warn('Failed to decode token:', error);
    }
    // 如果无法解析token或没有exp声明，使用基于当前时间的估计
    return Date.now() + DEFAULT_TOKEN_LIFETIME;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const response = await axios.post(`${SSO_URL}api/token_refresh/`, { refresh: refreshToken });
        if (response.data.access) {
          localStorage.setItem('jwt_token', response.data.access);
          return response.data.access;
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        authService.logout();
      }
    }
    return null;
  },

  setupTokenRefresh: () => {
    let refreshTimeout;

    const scheduleNextRefresh = () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log('No token found, skipping refresh scheduling');
        return;
      }

      const expirationTime = authService.getTokenExpiration(token);
      const currentTime = Date.now();
      let timeUntilRefresh = expirationTime - currentTime - REFRESH_THRESHOLD;

      // 确保刷新间隔不小于最小刷新间隔
      timeUntilRefresh = Math.max(timeUntilRefresh, MIN_REFRESH_INTERVAL);

      console.log(`Scheduling next token refresh in ${timeUntilRefresh / 1000} seconds`);

      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(async () => {
        console.log('Attempting to refresh token');
        const newToken = await authService.refreshToken();
        if (newToken) {
          console.log('Token refreshed successfully');
        }
        scheduleNextRefresh(); // 重新安排下一次刷新
      }, timeUntilRefresh);
    };

    // 立即开始第一次调度
    scheduleNextRefresh();

    // 返回一个清理函数，用于在需要时停止刷新调度
    return () => {
      clearTimeout(refreshTimeout);
    };
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
    window.location.href = `${SSO_URL}/login.html`;
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      // 解析JWT令牌获取用户信息
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      return JSON.parse(jsonPayload)
    }
    return null
  },

  verifyToken: async (token) => {
    try {
      const response = await axios.post(`${SSO_URL}api/token_verify/`, { token });
      return response.data.statusID === 1;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  updateLocalAccessToken: (token) => {
    localStorage.setItem('jwt_token', token);
  }
};

export default authService;