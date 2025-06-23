import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  fetchAllRoles,
  fetchRolePermissions,
  assignRolePermissions
} from '../../../services/permissionServices';

const PermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Permission categories structure
  const permissionCategories = [
    { name: 'Dashboard', permissions: ['dashboard_view'] },
    { 
      name: 'Customer', 
      permissions: ['customer_create', 'customer_view', 'customer_update', 'customer_delete', 'customer_sales'] 
    },
    { 
      name: 'Supplier', 
      permissions: ['supplier_view', 'supplier_create', 'supplier_update', 'supplier_delete'] 
    },
    { 
      name: 'Product', 
      permissions: ['product_create', 'product_view', 'product_update', 'product_delete', 'product_import', 'product_purchase'] 
    },
    { 
      name: 'Brand', 
      permissions: ['brand_create', 'brand_view', 'brand_update', 'brand_delete'] 
    },
    { 
      name: 'Category', 
      permissions: ['category_create', 'category_view', 'category_update', 'category_delete'] 
    },
    { 
      name: 'Unit', 
      permissions: ['unit_create', 'unit_view', 'unit_update', 'unit_delete'] 
    },
    { 
      name: 'Sale', 
      permissions: ['sale_create', 'sale_view', 'sale_update', 'sale_delete', 'sale_edit'] 
    },
    { 
      name: 'Purchase', 
      permissions: ['purchase_create', 'purchase_view', 'purchase_update', 'purchase_delete'] 
    },
    { 
      name: 'Report', 
      permissions: ['reports_summary', 'reports_sales', 'reports_inventory'] 
    },
    { 
      name: 'Role', 
      permissions: ['role_create', 'role_view', 'role_update', 'role_delete'] 
    },
    { 
      name: 'Permission', 
      permissions: ['permission_view'] 
    },
    { 
      name: 'User', 
      permissions: ['user_create', 'user_view', 'user_update', 'user_delete', 'user_suspend'] 
    },
    { 
      name: 'Settings', 
      permissions: [
        'website_settings', 'contact_settings', 'socials_settings', 
        'style_settings', 'custom_settings', 'notification_settings',
        'website_status_settings', 'invoice_settings'
      ] 
    }
  ];

  // State for role permissions
  const [rolePermissions, setRolePermissions] = useState({});

  // Fetch all roles
  const loadRoles = async () => {
    try {
      const rolesData = await fetchAllRoles();
      setRoles(rolesData);
      if (rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0].id);
      }
    } catch (error) {
      setError('Failed to fetch roles');
      console.error('Roles load error:', error);
    }
  };

  // Fetch permissions for a role
  const loadRolePermissions = async (roleId) => {
    try {
      setLoading(true);
      const permissions = await fetchRolePermissions(roleId);
      
      // Create an object with all permissions set to false initially
      const allPermissions = permissionCategories.flatMap(cat => cat.permissions);
      const initialPermissions = Object.fromEntries(
        allPermissions.map(perm => [perm, false])
      );
      
      // Update with the actual permissions from the backend
      permissions.forEach(perm => {
        initialPermissions[perm.name] = true;
      });
      
      setRolePermissions(initialPermissions);
    } catch (error) {
      setError(`Failed to fetch permissions for role ${roleId}`);
      console.error('Permissions load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save permissions to backend
  const savePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setLoading(true);
      
      // Get the list of permissions that are enabled
      const enabledPermissions = Object.entries(rolePermissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      await assignRolePermissions(selectedRole, enabledPermissions);
      toast.success('Permissions updated successfully!');
    } catch (error) {
      toast.error('Failed to update permissions');
      console.error('Permissions save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (permission) => {
    setRolePermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  // Load roles and permissions when component mounts
  useEffect(() => {
    loadRoles();
  }, []);

  // Load permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  if (loading && !selectedRole) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Permission Management</h1>
            <p className="text-indigo-100">Assign permissions to roles</p>
          </div>

          {/* Role Selection */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Role
                </label>
                <select
                  id="role"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(Number(e.target.value))}
                  disabled={loading}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={savePermissions}
                disabled={loading}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition duration-200 self-end ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {permissionCategories.map(category => (
                  <div key={category.name} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-200 px-4 py-2">
                      <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {category.permissions.map(permission => (
                        <div key={permission} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span 
                              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                rolePermissions[permission] ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            ></span>
                            <span className="text-sm text-gray-700">
                              {permission.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={rolePermissions[permission] || false}
                              onChange={() => handlePermissionToggle(permission)}
                              disabled={loading}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;