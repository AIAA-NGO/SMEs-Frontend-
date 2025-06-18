import axios from "axios";

const API_BASE_URL = "https://inventorymanagementsystem-latest-37zl.onrender.com/";

// Create a single axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to automatically include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================
export const loginUser = async ({ username, password }) => {
  return await api.post('api/auth/login', { username, password });
};

export const registerUser = async (userData) => {
  return await api.post('api/auth/register', userData);
};

export const refreshToken = async () => {
  return await api.post('api/auth/refresh-token');
};

export const fetchCurrentUser = async () => {
  return await api.get('api/auth/me');
};

// ==================== USER ENDPOINTS ====================
export const createUser = async (userData) => {
  return await api.post('api/users', userData);
};

export const getAllUsers = async () => {
  return await api.get('api/users');
};

export const getUserById = async (id) => {
  return await api.get(`api/users/${id}`);
};

export const updateUser = async (id, userData) => {
  return await api.put(`api/users/${id}`, userData);
};

export const deleteUser = async (id) => {
  return await api.delete(`api/users/${id}`);
};

export const getAllRoles = async () => {
  return await api.get('api/users/roles');
};

// ==================== DISCOUNT ENDPOINTS ====================
export const createDiscount = async (discountData) => {
  return await api.post('api/discounts', discountData);
};

export const getAllDiscounts = async () => {
  return await api.get('api/discounts');
};

export const getActiveDiscounts = async () => {
  return await api.get('api/discounts/active');
};

export const deleteDiscount = async (id) => {
  return await api.delete(`api/discounts/${id}`);
};

export default api;