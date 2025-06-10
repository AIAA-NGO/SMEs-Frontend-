import { useState } from 'react';

const PermissionManager = () => {
  const [permissions, setPermissions] = useState([
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

  const togglePermission = (index) => {
    const updatedPermissions = [...permissions];
    updatedPermissions[index].enabled = !updatedPermissions[index].enabled;
    setPermissions(updatedPermissions);
  };

  const handleSubmit = () => {
    const selectedPermissions = permissions.filter(perm => perm.enabled).map(perm => perm.name);
    console.log("Selected Permissions:", selectedPermissions);
    // Here you would typically send the data to your backend
    alert(`Permissions submitted: ${selectedPermissions.join(', ')}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Permission Management</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {permissions.map((permission, index) => (
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Submit Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;