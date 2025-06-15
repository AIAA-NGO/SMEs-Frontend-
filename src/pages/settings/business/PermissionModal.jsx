import { useState, useEffect } from 'react';
import { fetchPermissions, updateRolePermissions } from '../../../services/rolesServices';
import { toast } from 'react-toastify';

const PermissionManager = ({ role }) => {
  const [allPermissions, setAllPermissions] = useState([
    { name: "Disclaimer Name", enabled: false },
    { name: "Customer Status", enabled: false },
    { name: "Supplier Update", enabled: false },
    { name: "Product Update", enabled: false },
    { name: "Brand View", enabled: false },
    { name: "Category View", enabled: false },
    { name: "Unit View", enabled: false },
    { name: "Sub View", enabled: false },
    { name: "Purchase View", enabled: false },
    { name: "Reports Sales", enabled: false },
    { name: "Currency Update", enabled: false },
    { name: "Rule View", enabled: false },
    { name: "User Create", enabled: false },
    { name: "User Support", enabled: false },
    { name: "Style Settings", enabled: false },
    { name: "Invoice Settings", enabled: false },
    { name: "Customer Create", enabled: false },
    { name: "Customer Sales", enabled: false },
    { name: "Supplier Delete", enabled: false },
    { name: "Product Delete", enabled: false },
    { name: "Brand Update", enabled: false },
    { name: "Category Update", enabled: false },
    { name: "Unit Update", enabled: false },
    { name: "Sub Update", enabled: false },
    { name: "Purchase Update", enabled: false },
    { name: "Reports Inventory", enabled: false },
    { name: "Currency Delete", enabled: false },
    { name: "Rule Update", enabled: false },
    { name: "User View", enabled: false },
    { name: "Website Settings", enabled: false },
    { name: "Custom Settings", enabled: false },
    { name: "Product Purchase", enabled: false },
    { name: "Customer View", enabled: false },
    { name: "Supplier View", enabled: false },
    { name: "Product Create", enabled: false },
    { name: "Product Import", enabled: false },
    { name: "Brand Delete", enabled: false },
    { name: "Category Delete", enabled: false },
    { name: "Unit Delete", enabled: false },
    { name: "Sub Delete", enabled: false },
    { name: "Purchase Delete", enabled: false },
    { name: "Currency Create", enabled: false },
    { name: "Currency Set Default", enabled: false },
    { name: "Rule Delete", enabled: false },
    { name: "User Update", enabled: false },
    { name: "Contact Settings", enabled: false },
    { name: "Notification Settings", enabled: false },
    { name: "Sub Edit", enabled: false },
    { name: "Shuttle", enabled: false },
    { name: "Customer Update", enabled: false },
    { name: "Supplier Create", enabled: false },
    { name: "Product View", enabled: false },
    { name: "Brand Create", enabled: false },
    { name: "Category Create", enabled: false },
    { name: "Unit Create", enabled: false },
    { name: "Sub Create", enabled: false },
    { name: "Purchase Create", enabled: false },
    { name: "Reports Summary", enabled: false },
    { name: "Currency View", enabled: false },
    { name: "Permission View", enabled: false },
    { name: "User Delete", enabled: false },
    { name: "Details Settings", enabled: false },
    { name: "Website Status Settings", enabled: false }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load and map permissions from backend
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const backendPermissions = await fetchPermissions();
        
        setAllPermissions(prev => prev.map(perm => {
          const backendPerm = backendPermissions.find(p => p.name === perm.name);
          return {
            ...perm,
            id: backendPerm?.id,
            enabled: backendPerm ? (role?.permissions?.some(p => p.id === backendPerm.id) || false) : false
          };
        }));
        
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load permissions');
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [role]);

  const togglePermission = (index) => {
    setAllPermissions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        enabled: !updated[index].enabled
      };
      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      const selectedPermissionIds = allPermissions
        .filter(perm => perm.enabled && perm.id)
        .map(perm => perm.id);
      
      await updateRolePermissions(role.id, selectedPermissionIds);
      toast.success(`Permissions updated successfully for ${role.name}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update permissions');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {role ? `Loading permissions for ${role.name}...` : 'Permission Management'}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded-full w-12 float-right"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {role ? `Managing Permissions for ${role.name}` : 'Permission Management'}
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allPermissions.map((permission, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">{permission.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={permission.enabled}
                    onChange={() => togglePermission(index)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
              disabled={!role}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {role ? `Save Permissions for ${role.name}` : 'Select a role first'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;