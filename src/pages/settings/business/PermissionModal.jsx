import { useState, useEffect } from 'react'; // Add this import

export default function PermissionModal({ 
  isOpen, 
  onClose, 
  role, 
  permissions, 
  selectedPermissions, 
  onSave 
}) {
  const [selected, setSelected] = useState(selectedPermissions);

  useEffect(() => {
    setSelected(selectedPermissions);
  }, [selectedPermissions]);

  const togglePermission = (permId) => {
    setSelected(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId) 
        : [...prev, permId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(selected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Assign Permissions to {role?.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6 max-h-96 overflow-y-auto">
              {permissions.map(permission => (
                <div key={permission.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`perm-${permission.id}`}
                    checked={selected.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`perm-${permission.id}`} 
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {permission.name}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Permissions
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}