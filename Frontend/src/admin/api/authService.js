import apiClient from './apiClient';

export const authService = {
  async adminLogin(email, password) {
    const response = await apiClient.post('/auth/admin/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentAdmin() {
    const userStr = localStorage.getItem('admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('admin_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('admin_token');
  },
};
