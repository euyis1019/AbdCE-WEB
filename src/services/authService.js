import axios from '../http-common';
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

const SSO_URL = process.env.VUE_APP_SSO_URL || 'http://sso.abdn.kirisame.cc/';

const authService = {
  getCurrentUser: () => {
    const token = Cookies.get('jwt_token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return {
          ID: decodedToken.user_id,
          Name: decodedToken.name,
          StudentId: decodedToken.username,
          TokenType: decodedToken.token_type,
          ExpirationTime: decodedToken.exp,
          Permission: decodedToken.Permission || '0',
          grade: decodedToken.grade,
          major_class: decodedToken.major_class
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  },

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

  logout: async () => {

      Cookies.remove('jwt_token');
      Cookies.remove('refresh_token');
      
      // 重定向到SSO登出页面
      window.location.href = `${SSO_URL}ce/login.html`;
    
  },

  checkUserPermission: async (retryCount = 0) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.StudentId) {
        if (retryCount < 3) {
          console.log(`Retry attempt ${retryCount + 1} for user permission check`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return authService.checkUserPermission(retryCount + 1);
        }
        throw new Error('User not logged in or username not available');
      }

      const response = await axios.get('/admin/checkself', {
        params: { userID: currentUser.StudentId }
      });

      if (response.data && response.data.level !== undefined) {
        return response.data.level;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Error checking user permission:', error);
      if (retryCount < 3) {
        console.log(`Retry attempt ${retryCount + 1} for user permission check`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return authService.checkUserPermission(retryCount + 1);
      }
      return 0; // 出错时默认为普通用户
    }
  },

  getUserRoleName: (level) => {
    if (level >= 30) return '管理员';
    if (level > 0) return '审核员';
    return '普通用户';
  },

  getUserRoleColor: (level) => {
    if (level >= 30) return 'danger';
    if (level > 0) return 'warning';
    return 'success';
  },

  verifyToken: async (token) => {
    try {
      const response = await axios.post(`${SSO_URL}api/token_verify/`, { token });
      return response.status === 200;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
};

export default authService;