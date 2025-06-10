import axios from "axios";

const API_BASE_URL = "http://localhost:8080/";

// LOGIN - use `username`, not `email`
export const loginUser = async ({ username, password }) => {
  return await axios.post(`${API_BASE_URL}api/auth/login`, {
    username,
    password,
  });
};

// REGISTER - use correct auth registration endpoint
export const registerUser = async (userData) => {
  return await axios.post(`${API_BASE_URL}api/auth/register`, userData);
};

// REFRESH TOKEN
export const refreshToken = async () => {
  return await axios.post(`${API_BASE_URL}api/auth/refresh-token`);
};

// GET CURRENT USER INFO
export const fetchCurrentUser = async (token) => {
  return await axios.get(`${API_BASE_URL}api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// CREATE NEW USER (Admin only) — optional if needed separately
export const createUser = async (userData, token) => {
  return await axios.post(`${API_BASE_URL}api/users`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// GET ALL USERS (Admin only)
export const getAllUsers = async (token) => {
  return await axios.get(`${API_BASE_URL}users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// GET USER BY ID
export const getUserById = async (id, token) => {
  return await axios.get(`${API_BASE_URL}users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// UPDATE USER BY ID
export const updateUser = async (id, userData, token) => {
  return await axios.put(`${API_BASE_URL}users/${id}`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// DELETE USER BY ID (Admin only)
export const deleteUser = async (id, token) => {
  return await axios.delete(`${API_BASE_URL}users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// GET ALL ROLES
export const getAllRoles = async (token) => {
  return await axios.get(`${API_BASE_URL}users/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
