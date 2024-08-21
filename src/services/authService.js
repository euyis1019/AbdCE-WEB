import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import axios from 'axios';

const SSO_URL = process.env.VUE_APP_SSO_URL || 'http://sso.abdn.kirisame.cc/ce/';

const authService = {
  refreshToken: async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      try {
        const response = await axios.post(`${SSO_URL}api/token_refresh/`, { refresh: refreshToken });
        if (response.data.access) {
          Cookies.set('jwt_token', response.data.access);
          return response.data.access;
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        authService.logout();
      }
    }
    return null;
  },

  logout: () => {
    Cookies.remove('jwt_token');
    Cookies.remove('refresh_token');
    window.location.href = `${SSO_URL}login.html`;
  },

  getCurrentUser: () => {
    const token = Cookies.get('jwt_token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return {
          ID: decodedToken.user_id,
          Name: decodedToken.username,
          TokenType: decodedToken.token_type,
          ExpirationTime: decodedToken.exp,
          Permission: decodedToken.Permission || '0'  // 添加这行，确保有 Permission 属性
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  },

  verifyToken: async (token) => {
    try {
      const decodedToken = jwtDecode(token);  // 使用 jwtDecode
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedToken.exp > currentTime;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  updateLocalAccessToken: (token) => {
    Cookies.set('jwt_token', token);
  }
};

export default authService;
