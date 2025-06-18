import axios from "axios";

const API_BASE_URL = "https://inventorymanagementsystem-latest-37zl.onrender.com/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
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

// Auth functions
export const loginUser = async ({ username, password }) => {
  try {
    const response = await api.post("auth/login", { username, password });
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post("auth/register", userData);
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchCurrentUser = async () => {
  try {
    const response = await api.get("auth/me");
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const refreshToken = async () => {
  try {
    const response = await api.post("auth/refresh-token");
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const logoutUser = async () => {
  try {
    await api.post("auth/logout");
    return { data: null, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

// User functions
export const getAllUsers = async () => {
  try {
    const response = await api.get("users");
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.get(`users/${id}`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post("users", userData);
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`users/${id}`, userData);
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`users/${id}`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const changePassword = async (id, passwordData) => {
  try {
    const response = await api.put(`users/${id}/password`, passwordData);
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const uploadProfileImage = async (id, imageFile) => {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);
    
    const response = await api.post(`users/${id}/upload-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAllRoles = async () => {
  try {
    const response = await api.get("users/roles");
    return { data: response.data, error: null };
  } catch (error) {
    return handleApiError(error);
  }
};

const handleApiError = (error) => {
  if (error.response) {
    return {
      error: true,
      message: error.response.data?.message || "An error occurred",
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    return {
      error: true,
      message: "No response from server",
      status: null,
    };
  } else {
    return {
      error: true,
      message: error.message,
      status: null,
    };
  }
};

export default api;