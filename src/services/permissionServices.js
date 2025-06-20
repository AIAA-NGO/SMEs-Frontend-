// src/services/permissionServices.js
import axios from 'axios';

const API_URL = 'REACT_APP_API_BASE_URL/permissions'; // Adjust port if needed

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchAllPermissions = async () => {
  try {n
    const response = await axios.get(API_URL, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Permission fetch error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    throw error;
  }
};