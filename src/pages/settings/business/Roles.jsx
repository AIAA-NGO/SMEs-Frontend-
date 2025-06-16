import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchRoles as fetchRolesService, deleteRole as deleteRoleService, updateRole } from '../../../services/rolesServices';
import Modal from '../../../components/Modal';

const RolesList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [editName, setEditName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const data = await fetchRolesService();
        setRoles(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load roles');
        toast.error('Failed to fetch roles');
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await deleteRoleService(id);
        toast.success('Role deleted successfully');
        setRoles(prevRoles => prevRoles.filter(role => role.id !== id));
      } catch (err) {
        toast.error(err.message || 'Failed to delete role');
      }
    }
  };

  const handleEditClick = (role) => {
    setCurrentRole(role);
    setEditName(role.name);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedRole = await updateRole(currentRole.id, { name: editName });
      toast.success('Role updated successfully');
      setRoles(prevRoles =>
        prevRoles.map(role => (role.id === currentRole.id ? updatedRole : role))
      );
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handlePermissionsClick = (roleId) => {
    navigate(`/settings/business/roles-permissions/${roleId}`);
  };

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading roles...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Role: ${currentRole?.name}`}
      >
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Role Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions Management</h1>
        <div className="flex space-x-4">
          <Link
            to="/settings/business/roles-permissions"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            View All Permissions
          </Link>
          <Link
            to="/roles/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Create New Role
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search roles..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRoles.length > 0 ? (
              filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {role.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-4">
                     
                      <button
                        onClick={() => handleEditClick(role)}
                        className="text-yellow-600 hover:text-yellow-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-red-600 hover:text-red-900 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No roles match your search' : 'No roles found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesList;