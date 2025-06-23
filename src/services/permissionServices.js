import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://inventorymanagementsystem-latest-37zl.onrender.com/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Role Management
export const fetchAllRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Roles fetch error:', error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/roles`, roleData, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Role creation error:', error);
    throw error;
  }
};

export const fetchRoleById = async (roleId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles/${roleId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Role fetch error:', error);
    throw error;
  }
};

export const updateRole = async (roleId, roleData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/roles/${roleId}`, roleData, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Role update error:', error);
    throw error;
  }
};

export const deleteRole = async (roleId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/${roleId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Role deletion error:', error);
    throw error;
  }
};

// Permission Management
export const fetchRolePermissions = async (roleId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles/${roleId}/permissions`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Permissions fetch error:', error);
    throw error;
  }
};

export const assignRolePermissions = async (roleId, permissions) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/roles/${roleId}/permissions`,
      { permissions },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Permissions assignment error:', error);
    throw error;
  }
};

export const removeRolePermissions = async (roleId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/${roleId}/permissions`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Permissions removal error:', error);
    throw error;
  }
};

// All Permissions
export const fetchAllPermissions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permissions`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('All permissions fetch error:', error);
    throw error;
  }
};