import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/inventory';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for auth tokens
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const InventoryService = {
  async getInventoryStatus(params = {}) {
    try {
      const response = await apiClient.get('', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  async adjustInventory(request) {
    try {
      await apiClient.post('/adjust', request);
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      throw error;
    }
  },

  async removeExpiredProducts() {
    try {
      await apiClient.post('/remove-expired');
    } catch (error) {
      console.error('Error removing expired products:', error);
      throw error;
    }
  },

  async getLowStockSuggestions() {
    try {
      const response = await apiClient.get('/low-stock-suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock suggestions:', error);
      throw error;
    }
  }
};