import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  fetchAllRoles,
  fetchRolePermissions,
  assignRolePermissions,
  fetchAllPermissions,
  getDefaultPermissionsForRole
} from '../../../services/permissionServices';

const PermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  
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

  const [rolePermissions, setRolePermissions] = useState({});

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [rolesData, permissionsData] = await Promise.all([
          fetchAllRoles(),
          fetchAllPermissions()
        ]);
        
        setRoles(rolesData);
        setAllPermissions(permissionsData);
        
        if (rolesData.length > 0) {
          setSelectedRole(rolesData[0].id);
        }
      } catch (error) {
        setError('Failed to load initial data');
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      const loadPermissions = async () => {
        try {
          setLoading(true);
          const permissions = await fetchRolePermissions(selectedRole);
          
          // Initialize all permissions to false
          const allPermissionNames = permissionCategories.flatMap(cat => cat.permissions);
          const initialPermissions = Object.fromEntries(
            allPermissionNames.map(perm => [perm, false])
          );
          
          // Set to true for permissions the role has
          permissions.forEach(perm => {
            initialPermissions[perm] = true;
          });
          
          setRolePermissions(initialPermissions);
        } catch (error) {
          setError(`Failed to load permissions for role ${selectedRole}`);
          console.error('Permission load error:', error);
        } finally {
          setLoading(false);
        }
      };

      loadPermissions();
    }
  }, [selectedRole]);

  // Apply default permissions for the selected role
  const applyDefaultPermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setLoading(true);
      const role = roles.find(r => r.id === selectedRole);
      if (!role) return;
      
      const defaultPermissions = getDefaultPermissionsForRole(role.name);
      
      const newPermissions = {};
      Object.keys(rolePermissions).forEach(perm => {
        newPermissions[perm] = defaultPermissions.includes(perm);
      });
      
      setRolePermissions(newPermissions);
      toast.success(`Loaded default permissions for ${role.name}`);
    } catch (error) {
      toast.error('Failed to load default permissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Save permissions to backend
  const savePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setLoading(true);
      
      // Get enabled permissions
      const enabledPermissions = Object.entries(rolePermissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      await assignRolePermissions(selectedRole, enabledPermissions);
      toast.success('Permissions saved successfully!');
    } catch (error) {
      toast.error('Failed to save permissions');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle single permission
  const togglePermission = (permission) => {
    setRolePermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  // Toggle all permissions in a category
  const toggleCategory = (category, enable) => {
    setRolePermissions(prev => {
      const newPermissions = {...prev};
      category.permissions.forEach(perm => {
        newPermissions[perm] = enable;
      });
      return newPermissions;
    });
  };

  if (loading && !selectedRole) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Role Permissions</h1>
          <p className="text-blue-100">Manage permissions for each role</p>
        </div>

        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Role
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
                disabled={loading}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={applyDefaultPermissions}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                Load Defaults
              </button>
              <button
                onClick={savePermissions}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {permissionCategories.map(category => {
                const allEnabled = category.permissions.every(perm => rolePermissions[perm]);
                const someEnabled = category.permissions.some(perm => rolePermissions[perm]);
                
                return (
                  <div key={category.name} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-200 px-4 py-2 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">{category.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCategory(category, true)}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                        >
                          All
                        </button>
                        <button
                          onClick={() => toggleCategory(category, false)}
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                        >
                          None
                        </button>
                      </div>
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
                              onChange={() => togglePermission(permission)}
                              disabled={loading}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;