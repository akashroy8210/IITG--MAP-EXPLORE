import apiClient from './apiClient';

export const mapService = {
  async getMaps() {
    const response = await apiClient.get('/admin/maps');
    return response.data;
  },

  async getMap(id) {
    const response = await apiClient.get(`/admin/maps/${id}`);
    return response.data;
  },

  async createMap(mapUrl) {
    const response = await apiClient.post('/admin/maps', { mapUrl });
    return response.data;
  },
};
