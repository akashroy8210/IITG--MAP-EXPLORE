import apiClient from './apiClient';

export const setsService = {
  listSets: () => apiClient.get('/admin/sets').then((res) => res.data),
  getSet: (id) => apiClient.get(`/admin/sets/${id}`).then((res) => res.data),
  generateSets: (data = {}) => apiClient.post('/admin/sets/generate', data).then((res) => res.data),
  assignSets: () => apiClient.post('/admin/sets/assign').then((res) => res.data),
  deleteSet: (id) => apiClient.delete(`/admin/sets/${id}`).then((res) => res.data),
  deleteAllSets: () => apiClient.delete('/admin/sets').then((res) => res.data),
};

export default setsService;
