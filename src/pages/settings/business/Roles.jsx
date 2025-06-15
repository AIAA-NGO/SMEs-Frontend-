import { useState, useEffect, useCallback } from 'react';
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
} from '../../../services/rolesServices';
import RoleModal from './RoleModal';
import PermissionModal from './PermissionModal';
import { toast } from 'react-toastify';

// Define outside component to prevent recreation
const INITIAL_ROLES = [
  { id: 1, name: 'ADMIN', permissions: [] },
  { id: 2, name: 'MANAGER', permissions: [] },
  { id: 3, name: 'CASHIER', permissions: [] }
];

const BASIC_PERMISSIONS = [
  { id: 1, name: 'user.create' },
  { id: 2, name: 'user.update' },
  { id: 3, name: 'user.delete' },
  { id: 4, name: 'role.manage' }
];

export default function RoleTable() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionsWarning, setPermissionsWarning] = useState(null);

  const loadData = useCallback(async () => {
    try {
      // Display initial data immediately
      setRoles(INITIAL_ROLES);
      
      // Fetch data from API
      const [rolesData, permissionsData] = await Promise.all([
        fetchRoles().catch(err => {
          toast.error(err.message);
          throw err;
        }),
        fetchPermissions().then(data => {
          if (JSON.stringify(data) === JSON.stringify(BASIC_PERMISSIONS)) {
            setPermissionsWarning('Using default permissions - could not load from server');
            toast.warning('Using default permissions');
          }
          return data;
        })
      ]);
      
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRole = () => {
    setCurrentRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role) => {
    setCurrentRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole(id);
        setRoles(roles.filter(role => role.id !== id));
        toast.success('Role deleted successfully');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleSaveRole = async (roleData) => {
    try {
      const response = roleData.id 
        ? await updateRole(roleData.id, roleData)
        : await createRole(roleData);
      
      setRoles(roleData.id
        ? roles.map(r => r.id === roleData.id ? response : r)
        : [...roles, response]);
      
      toast.success(`Role ${roleData.id ? 'updated' : 'created'} successfully`);
      setIsRoleModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssignPermissions = (role) => {
    setCurrentRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = async (permissionIds) => {
    try {
      await updateRolePermissions(currentRole.id, permissionIds);
      const updatedRoles = await fetchRoles();
      setRoles(updatedRoles);
      toast.success('Permissions updated successfully');
      setIsPermissionModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Role Management</h1>
          <button disabled className="bg-gray-400 text-white px-4 py-2 rounded flex items-center">
            Loading...
          </button>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {INITIAL_ROLES.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-12 inline-block"></div>
                    <div className="h-6 bg-gray-200 rounded w-24 inline-block"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 inline-block"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {permissionsWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">Notice</p>
              <p>{permissionsWarning}</p>
            </div>
            <button 
              onClick={() => setPermissionsWarning(null)}
              className="text-yellow-700 hover:text-yellow-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <button
          onClick={handleAddRole}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Role
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.length > 0 ? (
                      role.permissions.map(p => (
                        <span key={p.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {p.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs">No permissions</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  <button onClick={() => handleEditRole(role)} className="text-blue-600 hover:text-blue-900">
                    Edit
                  </button>
                  <button onClick={() => handleAssignPermissions(role)} className="text-green-600 hover:text-green-900">
                    Permissions
                  </button>
                  <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={currentRole}
        onSave={handleSaveRole}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        role={currentRole}
        permissions={permissions}
        selectedPermissions={currentRole?.permissions || []}
        onSave={handleSavePermissions}
      />
    </div>
  );
}