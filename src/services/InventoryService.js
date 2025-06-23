import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const InventoryService = {
  async getInventoryStatus(search, categoryId, brandId, lowStockOnly, expiredOnly, pageable) {
    try {
      const params = {
        ...pageable,
        search: search || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        lowStockOnly: lowStockOnly || undefined,
        expiredOnly: expiredOnly || undefined
      };
      
      const response = await apiClient.get('/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  async adjustInventory(request) {
    try {
      const response = await apiClient.post('/inventory/adjust', request);
      return response.data;
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      throw error;
    }
  },

  async removeExpiredProducts() {
    try {
      const response = await apiClient.post('/inventory/remove-expired');
      return response.data;
    } catch (error) {
      console.error('Error removing expired products:', error);
      throw error;
    }
  },

  async getAdjustmentHistory(productId) {
    try {
      const response = await apiClient.get(`/inventory/adjustments/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching adjustment history:', error);
      throw error;
    }
  },

  async getLowStockSuggestions() {
    try {
      const response = await apiClient.get('/inventory/low-stock-suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock suggestions:', error);
      throw error;
    }
  },

  async getLowStockItems() {
    try {
      const response = await apiClient.get('/products/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  async getExpiringProducts() {
    try {
      const response = await apiClient.get('/products/expiring');
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      throw error;
    }
  },

  async searchProducts(query) {
    try {
      const response = await apiClient.get('/products/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  async getInventoryValuation() {
    try {
      const response = await apiClient.get('/inventory/valuation');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory valuation:', error);
      throw error;
    }
  },

  async getProductDetails(productId) {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  },

  async updateProductStock(productId, quantity) {
    try {
      const response = await apiClient.post(`/products/${productId}/stock`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }
};

export default InventoryService;