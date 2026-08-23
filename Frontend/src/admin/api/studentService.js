import apiClient from './apiClient';

export const studentService = {
  async getStudents(params = {}) {
    const response = await apiClient.get('/admin/students', { params });
    return response.data;
  },

  async getStudent(id) {
    const response = await apiClient.get(`/admin/students/${id}`);
    return response.data;
  },

  async createStudent(studentData) {
    const response = await apiClient.post('/admin/students', studentData);
    return response.data;
  },

  async bulkCreateStudents(studentsList) {
    const response = await apiClient.post('/admin/students/bulk', { students: studentsList });
    return response.data;
  },

  async updateStudentStatus(id, status) {
    const response = await apiClient.patch(`/admin/students/${id}/status`, { status });
    return response.data;
  },

  async resetPassword(id) {
    const response = await apiClient.post(`/admin/students/${id}/reset-password`);
    return response.data;
  },

  async regenerateRouteKey(id) {
    const response = await apiClient.post(`/admin/students/${id}/regenerate-routekey`);
    return response.data;
  },

  async deleteStudent(id) {
    const response = await apiClient.delete(`/admin/students/${id}`);
    return response.data;
  },
};
