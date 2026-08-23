import apiClient from './apiClient';

export const adminService = {
  async getDashboardStats() {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  async getMembers() {
    const response = await apiClient.get('/admin/members');
    return response.data;
  },

  async getMember(id) {
    const response = await apiClient.get(`/admin/members/${id}`);
    return response.data;
  },

  async createMember(memberData) {
    const response = await apiClient.post('/admin/members', memberData);
    return response.data;
  },

  async bulkCreateMembers(membersList) {
    const response = await apiClient.post('/admin/members/bulk', { members: membersList });
    return response.data;
  },

  async updateMemberStatus(id, isActive) {
    const response = await apiClient.patch(`/admin/members/${id}/status`, { isActive });
    return response.data;
  },
};
