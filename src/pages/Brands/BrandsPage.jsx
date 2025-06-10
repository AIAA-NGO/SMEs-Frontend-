import React, { useEffect, useState, useRef } from 'react';
import * as brandAPI from '../../services/brand';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const componentRef = useRef();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await brandAPI.getBrands();
      // The brands are in the content property of the response
      const brandsData = Array.isArray(response) ? response : [];
      setBrands(brandsData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch brands', err);
      setError('Failed to fetch brands. Please try again.');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Brand name is required');
      return;
    }

    setLoading(true);
    try {
      const newBrand = await brandAPI.addBrand({
        name: name.trim(),
        description: description.trim()
      });
      setBrands(prevBrands => [...prevBrands, newBrand]);
      setName('');
      setDescription('');
      setError('');
    } catch (err) {
      console.error('Error adding brand:', err);
      setError(err.response?.data?.message || 'Failed to add brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;

    setLoading(true);
    try {
      await brandAPI.deleteBrand(id);
      setBrands(prevBrands => prevBrands.filter(brand => brand.id !== id));
      setError('');
    } catch (err) {
      console.error('Error deleting brand:', err);
      setError(err.response?.data?.message || 'Failed to delete brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (brand) => {
    setEditingId(brand.id);
    setEditingName(brand.name);
    setEditingDescription(brand.description || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDescription('');
  };

  const handleUpdate = async () => {
    if (!editingName.trim()) {
      setError('Brand name is required');
      return;
    }

    setLoading(true);
    try {
      const updatedBrand = await brandAPI.updateBrand(editingId, {
        name: editingName.trim(),
        description: editingDescription.trim()
      });
      setBrands(prevBrands => 
        prevBrands.map(brand => brand.id === editingId ? updatedBrand : brand)
      );
      cancelEditing();
      setError('');
    } catch (err) {
      console.error('Error updating brand:', err);
      setError(err.response?.data?.message || 'Failed to update brand. Please try again.');
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
        button, form { display: none !important; }
      }
    `
  });

  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      brands.map(brand => ({
        ID: brand.id,
        Name: brand.name,
        Description: brand.description || 'N/A',
        'Created At': brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : 'N/A'
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Brands");
    XLSX.writeFile(workbook, "brands.xlsx");
  };

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow" ref={componentRef}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Brands Management</h1>
        <div className="flex space-x-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
          >
            Print
          </button>
          <CSVLink 
            data={filteredBrands.map(brand => ({
              ID: brand.id,
              Name: brand.name,
              Description: brand.description || 'N/A',
              'Created At': new Date(brand.createdAt).toLocaleDateString()
            }))} 
            filename={"brands.csv"}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
          >
            Download CSV
          </CSVLink>
          <button 
            onClick={handleExcelDownload}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* Add New Brand Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Add New Brand</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter brand name"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter brand description (optional)"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:bg-indigo-400"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Brand'}
          </button>
        </form>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search brands by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Brands Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && filteredBrands.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Loading brands...
                </td>
              </tr>
            ) : filteredBrands.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No brands match your search' : 'No brands found'}
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === brand.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border border-indigo-400 px-2 py-1 rounded w-full"
                        required
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingId === brand.id ? (
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="border border-indigo-400 px-2 py-1 rounded w-full"
                        rows={2}
                      />
                    ) : (
                      brand.description || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(brand.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === brand.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdate}
                          className="text-green-600 hover:text-green-900 disabled:text-green-300"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => startEditing(brand)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="text-red-600 hover:text-red-900"
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
    </div>
  );
};

export default BrandsPage;