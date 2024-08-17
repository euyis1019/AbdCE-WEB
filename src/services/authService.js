import axios from 'axios';

const SSO_URL = process.env.VUE_APP_SSO_URL || 'http://sso.abdn.kirisame.cc/ce/';

const authService = {
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  logout: () => {
    localStorage.removeItem('user');
    window.location.href = `${SSO_URL}login.html`; // 重定向到 SSO 登出页面
  },

  refreshToken: async () => {
    const user = authService.getCurrentUser();
    if (user && user.refresh) {
      try {
        const response = await axios.post(`${SSO_URL}token_refresh/`, { refresh: user.refresh });
        if (response.data.access) {
          user.access = response.data.access;
          localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
      } catch (error) {
        authService.logout();
        throw error;
      }
    }
    return null;
  },

  verifyToken: async (token) => {
    try {
      await axios.post(`${SSO_URL}token_verify/`, { token });
      return true;
    } catch (error) {
      return false;
    }
  },

  updateLocalAccessToken: (token) => {
    let user = authService.getCurrentUser();
    user.access = token;
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export default authService;