// permissionServices.js
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

// Get all roles
export const fetchAllRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Get permissions for a specific role
export const fetchRolePermissions = async (roleId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/role-permissions/${roleId}/details`, 
      getAuthHeader()
    );
    return response.data.permissions || [];
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }
};

// Assign permissions to a role
export const assignRolePermissions = async (roleId, permissionNames) => {
  try {
    // First get all permissions to map names to IDs
    const allPermissions = await fetchAllPermissions();
    
    // Map permission names to their IDs
    const permissionIds = permissionNames.map(permName => {
      const perm = allPermissions.find(p => p.name === permName);
      return perm ? perm.id : null;
    }).filter(id => id !== null);

    const response = await axios.post(
      `${API_BASE_URL}/role-permissions/assign`,
      {
        roleId: roleId,
        permissionIds: permissionIds
      },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning permissions:', error);
    throw error;
  }
};

// Get all available permissions
export const fetchAllPermissions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permissions`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching all permissions:', error);
    throw error;
  }
};

// Get default permissions for a role
export const getDefaultPermissionsForRole = (roleName) => {
  const defaultPermissions = {
    ADMIN: [
      'dashboard_view',
      'customer_create', 'customer_view', 'customer_update', 'customer_delete',
      'supplier_create', 'supplier_view', 'supplier_update', 'supplier_delete',
      'product_create', 'product_view', 'product_update', 'product_delete',
      'sale_create', 'sale_view', 'sale_update', 'sale_delete',
      'purchase_create', 'purchase_view', 'purchase_update', 'purchase_delete',
      'role_create', 'role_view', 'role_update', 'role_delete',
      'user_create', 'user_view', 'user_update', 'user_delete'
    ],
    CASHIER: [
      'dashboard_view',
      'customer_view',
      'product_view',
      'sale_create', 'sale_view'
    ],
    MANAGER: [
      'dashboard_view',
      'customer_create', 'customer_view', 'customer_update',
      'product_create', 'product_view', 'product_update',
      'sale_create', 'sale_view', 'sale_update',
      'purchase_view',
      'reports_summary', 'reports_sales'
    ]
  };

  return defaultPermissions[roleName.toUpperCase()] || [];
};