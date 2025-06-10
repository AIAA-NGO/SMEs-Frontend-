import React, { useEffect, useState, useRef } from 'react';
import * as unitAPI from '../../services/Unit';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

const UnitsPage = () => {
  const [units, setUnits] = useState([]);
  const [newUnit, setNewUnit] = useState({
    name: '',
    abbreviation: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editingUnit, setEditingUnit] = useState({
    name: '',
    abbreviation: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const componentRef = useRef();

  // Format date for display
  const formatCreatedAt = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Fetch units from API
  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await unitAPI.getUnits();
      // Extract the units array from the response
      const unitsData = response.content || [];
      setUnits(unitsData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch units', err);
      setError('Failed to fetch units. Please try again.');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name.trim() || !newUnit.abbreviation.trim()) {
      setError('Both name and abbreviation are required');
      return;
    }

    // Check if unit already exists
    const unitExists = units.some(
      unit => unit.name.toLowerCase() === newUnit.name.toLowerCase() || 
             unit.abbreviation.toLowerCase() === newUnit.abbreviation.toLowerCase()
    );

    if (unitExists) {
      setError('A unit with this name or abbreviation already exists');
      return;
    }

    setLoading(true);
    try {
      const addedUnit = await unitAPI.addUnit(newUnit);
      setUnits(prevUnits => [...prevUnits, addedUnit]);
      setNewUnit({ name: '', abbreviation: '' });
      setShowAddModal(false);
      setError('');
      setSuccess('Unit added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding unit:', err);
      setError(err.response?.data?.message || 'Failed to add unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;

    setLoading(true);
    try {
      await unitAPI.deleteUnit(id);
      setUnits(prevUnits => prevUnits.filter(unit => unit.id !== id));
      setError('');
      setSuccess('Unit deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting unit:', err);
      setError(err.response?.data?.message || 'Failed to delete unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (unit) => {
    setEditingId(unit.id);
    setEditingUnit({
      name: unit.name,
      abbreviation: unit.abbreviation
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingUnit({ name: '', abbreviation: '' });
  };

  const handleUpdate = async () => {
    if (!editingUnit.name.trim() || !editingUnit.abbreviation.trim()) {
      setError('Both name and abbreviation are required');
      return;
    }

    // Check if another unit already has this name or abbreviation
    const unitExists = units.some(
      unit => unit.id !== editingId && 
             (unit.name.toLowerCase() === editingUnit.name.toLowerCase() || 
              unit.abbreviation.toLowerCase() === editingUnit.abbreviation.toLowerCase())
    );

    if (unitExists) {
      setError('Another unit with this name or abbreviation already exists');
      return;
    }

    setLoading(true);
    try {
      const updatedUnit = await unitAPI.updateUnit(editingId, editingUnit);
      setUnits(prevUnits => 
        prevUnits.map(unit => unit.id === editingId ? updatedUnit : unit)
      );
      cancelEditing();
      setError('');
      setSuccess('Unit updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating unit:', err);
      setError(err.response?.data?.message || 'Failed to update unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        button, form, .no-print { display: none !important; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .print-header { display: block !important; }
      }
    `,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        fetchUnits().then(() => resolve());
      });
    },
    onAfterPrint: () => {
      console.log('Printed successfully');
    }
  });

  const handleExcelDownload = () => {
    if (units.length === 0) {
      setError('There is nothing to export');
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(
      units.map(unit => ({
        ID: unit.id,
        Name: unit.name,
        Abbreviation: unit.abbreviation,
        'Created At': formatCreatedAt(unit.createdAt)
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Units");
    XLSX.writeFile(workbook, "units.xlsx");
  };

  const filteredUnits = units.filter(unit => 
    unit?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit?.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Measurement Units</h1>
        <div className="flex space-x-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 no-print transition-colors duration-200"
          >
            Print
          </button>
          <CSVLink 
            data={filteredUnits.map(unit => ({
              ID: unit.id,
              Name: unit.name,
              Abbreviation: unit.abbreviation,
              'Created At': formatCreatedAt(unit.createdAt)
            }))} 
            filename={"units.csv"}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 no-print transition-colors duration-200"
            onClick={() => {
              if (units.length === 0) {
                setError('There is nothing to export');
                return false;
              }
              return true;
            }}
          >
            Download CSV
          </CSVLink>
          <button 
            onClick={handleExcelDownload}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 no-print transition-colors duration-200"
          >
            Download Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 no-print transition-colors duration-200"
          >
            Add Unit
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 no-print">
        <div className="relative">
          <input
            type="text"
            placeholder="Search units by name or abbreviation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 no-print">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200 no-print">
          {success}
        </div>
      )}

      {/* Loading State */}
      {loading && units.length === 0 && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded border border-blue-200">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading units from the server...</span>
          </div>
        </div>
      )}

      {/* Print Header (hidden until printing) */}
      <div className="hidden print-header mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Measurement Units</h1>
        <p className="text-gray-600">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {/* Units Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm" ref={componentRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abbreviation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  <div className="flex justify-center items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading units...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No units match your search' : 'No units found'}
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unit.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === unit.id ? (
                      <input
                        type="text"
                        value={editingUnit.name}
                        onChange={(e) => setEditingUnit({...editingUnit, name: e.target.value})}
                        className="border border-blue-400 px-2 py-1 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200"
                        required
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{unit.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === unit.id ? (
                      <input
                        type="text"
                        value={editingUnit.abbreviation}
                        onChange={(e) => setEditingUnit({...editingUnit, abbreviation: e.target.value})}
                        className="border border-blue-400 px-2 py-1 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200"
                        required
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{unit.abbreviation}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCreatedAt(unit.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                    {editingId === unit.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdate}
                          className="text-green-600 hover:text-green-900 disabled:text-green-300 transition-colors duration-200"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => startEditing(unit)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Unit</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name *</label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                  placeholder="e.g. Kilograms"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation *</label>
                <input
                  type="text"
                  value={newUnit.abbreviation}
                  onChange={(e) => setNewUnit({...newUnit, abbreviation: e.target.value})}
                  placeholder="e.g. KG"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUnit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : 'Add Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitsPage;