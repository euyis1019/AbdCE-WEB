import axios from '../http-common';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const SSO_URL = process.env.VUE_APP_SSO_URL || 'http://sso.abdn.kirisame.cc/ce/';

const authService = {

  refreshToken: async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      try {
        const response = await axios.post(`${SSO_URL}api/token_refresh/`, { refresh: refreshToken });
        if (response.data.access) {
          Cookies.set('jwt_token', response.data.access);
          const authStore = useAuthStore()
          await authStore.fetchPermissionLevel() // 在这里更新权限
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
    window.location.href = `${SSO_URL}ce/login.html`;
  },

  getCurrentUser: () => {
    const token = Cookies.get('jwt_token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return {
          ID: decodedToken.user_id,
          Name: decodedToken.name,  // 使用name字段作为用户姓名
          StudentId: decodedToken.username,  // 使用username作为学号
          TokenType: decodedToken.token_type,
          ExpirationTime: decodedToken.exp,
          Permission: decodedToken.Permission || '0'
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
  },

  checkUserPermission: async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.ID) {
        throw new Error('User not logged in or ID not available');
      }
  
      const response = await axios.get('/admin/checkself', {
        params: { userID: currentUser.ID }
      });
  
      if (response.data && response.data.level !== undefined) {
        return response.data.level;
      }
      return 0; // 默认为普通用户
    } catch (error) {
      console.error('Error checking user permission:', error);
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
  }
};

export default authService;
