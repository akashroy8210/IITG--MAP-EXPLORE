import apiClient from './apiClient';

export const questionService = {
  listQuestions: (params = {}) => apiClient.get('/admin/questions', { params }).then((res) => res.data),
  getQuestion: (id) => apiClient.get(`/admin/questions/${id}`).then((res) => res.data),
  createQuestion: (data) => apiClient.post('/admin/questions', data).then((res) => res.data),
  updateQuestion: (id, data) => apiClient.put(`/admin/questions/${id}`, data).then((res) => res.data),
  deleteQuestion: (id) => apiClient.delete(`/admin/questions/${id}`).then((res) => res.data),
  bulkUploadQuestions: (questions) => apiClient.post('/admin/questions/bulk', { questions }).then((res) => res.data),
};

export default questionService;
