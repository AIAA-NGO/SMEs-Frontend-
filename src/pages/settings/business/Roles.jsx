import { useState } from 'react';
import RoleModal from './RoleModal';
import PermissionModal from './PermissionModal';

export default function RoleTable() {
  const [roles, setRoles] = useState([
    { id: 1, name: 'ROLE_ADMIN' },
    { id: 2, name: 'ROLE_CASHIER' },
    { id: 3, name: 'ROLE_MANAGER' }
  ]);
  
  const [permissions] = useState([
    { id: 1, name: 'CREATE_PRODUCT' },
    { id: 2, name: 'READ_PRODUCT' },
    { id: 3, name: 'UPDATE_PRODUCT' },
    { id: 4, name: 'DELETE_PRODUCT' },
    { id: 5, name: 'MANAGE_USERS' }
  ]);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({
    
  });

  const handleAddRole = () => {
    setCurrentRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role) => {
    setCurrentRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== id));
      // Remove from rolePermissions
      const updatedPermissions = {...rolePermissions};
      delete updatedPermissions[id];
      setRolePermissions(updatedPermissions);
    }
  };

  const handleSaveRole = (role) => {
    if (role.id) {
      // Update existing role
      setRoles(roles.map(r => r.id === role.id ? role : r));
    } else {
      // Add new role
      const newId = Math.max(...roles.map(r => r.id), 0) + 1;
      setRoles([...roles, { ...role, id: newId }]);
      setRolePermissions({...rolePermissions, [newId]: []});
    }
    setIsRoleModalOpen(false);
  };

  const handleAssignPermissions = (role) => {
    setCurrentRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = (selectedPermissions) => {
    setRolePermissions({
      ...rolePermissions,
      [currentRole.id]: selectedPermissions
    });
    setIsPermissionModalOpen(false);
  };

  return (
    <div className="container mx-auto p-6">
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
                    {rolePermissions[role.id]?.map(permId => {
                      const perm = permissions.find(p => p.id === permId);
                      return (
                        <span key={permId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {perm?.name}
                        </span>
                      );
                    })}
                    {(!rolePermissions[role.id] || rolePermissions[role.id].length === 0) && (
                      <span className="text-gray-500 text-xs">No permissions</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleAssignPermissions(role)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Assign Permissions
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={currentRole}
        onSave={handleSaveRole}
      />

      {/* Permission Modal */}
      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        role={currentRole}
        permissions={permissions}
        selectedPermissions={currentRole ? rolePermissions[currentRole.id] || [] : []}
        onSave={handleSavePermissions}
      />
    </div>
  );
}