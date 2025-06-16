import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const PermissionManagement = () => {
  // Sample roles data - replace with your actual data from backend
  const [roles, setRoles] = useState([
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'MANAGER' },
    { id: 3, name: 'CASHIER' },
    { id: 4, name: 'RECEIVING_CLERK' }
  ]);

  // Selected role state
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || null);
  
  // Permission categories
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

  // State for role permissions (initialize with all false)
  const [rolePermissions, setRolePermissions] = useState(() => {
    const allPermissions = permissionCategories.flatMap(cat => cat.permissions);
    return Object.fromEntries(allPermissions.map(perm => [perm, false]));
  });

  // Load permissions for selected role
  useEffect(() => {
    if (selectedRole) {
      // Replace this with actual API call to fetch role permissions
      // For now, we'll just initialize with all false (no permissions assigned)
      const allPermissions = permissionCategories.flatMap(cat => cat.permissions);
      const newPermissions = Object.fromEntries(allPermissions.map(perm => [perm, false]));
      setRolePermissions(newPermissions);
    }
  }, [selectedRole]);

  // Handle permission toggle
  const handlePermissionToggle = (permission) => {
    setRolePermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  // Save permissions to backend
  const savePermissions = async () => {
    try {
      // Replace with actual API call to save permissions
      // await saveRolePermissions(selectedRole, rolePermissions);
      toast.success('Permissions updated successfully!');
    } catch (error) {
      toast.error('Failed to update permissions');
      console.error(error);
    }
  };

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
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={savePermissions}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition duration-200 self-end"
              >
                Save Permissions
              </button>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="p-6">
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
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;