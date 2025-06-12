import React, { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InventoryService } from '../../services/InventoryService';


const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    expiredOnly: false,
    lowStockOnly: false,
    page: 0,
    size: 10
  });
  const [totalItems, setTotalItems] = useState(0);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentAmount: 0,
    reason: '',
    createSupplierOrder: false,
    orderQuantity: 0
  });
  const [adjustmentHistory, setAdjustmentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getInventoryStatus(
        filters.search,
        null, // categoryId (not used in current implementation)
        null, // brandId (not used in current implementation)
        filters.lowStockOnly,
        filters.expiredOnly,
        {
          page: filters.page,
          size: filters.size,
          sort: 'name,asc' // Default sorting
        }
      );
      setInventory(response.content);
      setTotalItems(response.totalElements);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching inventory:', err);
      toast.error(`Error fetching inventory: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch adjustment history for a product
  const fetchAdjustmentHistory = async (productId) => {
    try {
      const history = await InventoryService.getAdjustmentHistory(productId);
      setAdjustmentHistory(history);
    } catch (err) {
      console.error('Error fetching adjustment history:', err);
      toast.error(`Error fetching adjustment history: ${err.message}`);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInventory();
  }, [filters]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      page: 0 // Reset to first page when searching
    }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Toggle expired only filter
  const toggleExpiredOnly = () => {
    setFilters(prev => ({
      ...prev,
      expiredOnly: !prev.expiredOnly,
      lowStockOnly: false, // Ensure only one filter is active at a time
      page: 0
    }));
  };

  // Toggle low stock only filter
  const toggleLowStockOnly = () => {
    setFilters(prev => ({
      ...prev,
      lowStockOnly: !prev.lowStockOnly,
      expiredOnly: false, // Ensure only one filter is active at a time
      page: 0
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Remove expired products
  const handleRemoveExpired = async () => {
    try {
      await InventoryService.removeExpiredProducts();
      toast.success('Expired products removed successfully!');
      fetchInventory();
    } catch (err) {
      toast.error(`Error removing expired products: ${err.message}`);
    }
  };

  // Open adjustment modal
  const openAdjustmentModal = (product) => {
    setCurrentProduct(product);
    setAdjustmentData({
      adjustmentAmount: 0,
      reason: '',
      createSupplierOrder: false,
      orderQuantity: 0
    });
    fetchAdjustmentHistory(product.id);
    setAdjustmentModal(true);
  };

  // Close adjustment modal
  const closeAdjustmentModal = () => {
    setAdjustmentModal(false);
    setCurrentProduct(null);
    setShowHistory(false);
  };

  // Handle adjustment form changes
  const handleAdjustmentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdjustmentData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  // Submit inventory adjustment
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const adjustmentRequest = {
        productId: currentProduct.id,
        adjustmentAmount: adjustmentData.adjustmentAmount,
        reason: adjustmentData.reason,
        createSupplierOrder: adjustmentData.createSupplierOrder,
        orderQuantity: adjustmentData.createSupplierOrder ? adjustmentData.orderQuantity : null
      };

      await InventoryService.adjustInventory(adjustmentRequest);
      toast.success('Inventory adjusted successfully!');
      closeAdjustmentModal();
      fetchInventory();
    } catch (err) {
      toast.error(`Error adjusting inventory: ${err.message}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return dateString ? format(new Date(dateString), 'MMM dd, yyyy') : 'N/A';
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    return dateString ? format(new Date(dateString), 'MMM dd, yyyy HH:mm') : 'N/A';
  };

  // Status badge component
  const StatusBadge = ({ product }) => {
    if (product.isExpired) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Expired
        </span>
      );
    }
    
    if (product.quantityInStock <= product.lowStockThreshold) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        In Stock
      </span>
    );
  };

  // Adjustment type badge
  const AdjustmentTypeBadge = ({ amount }) => {
    return amount > 0 ? (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        +{amount}
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        {amount}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-600 mt-1 md:mt-2">
            Track and manage your product inventory in real-time
          </p>
        </div>
        <button
          onClick={handleRemoveExpired}
          className="mt-4 md:mt-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Remove Expired
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, SKU, etc..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button 
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={toggleExpiredOnly}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                filters.expiredOnly 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expired Only
            </button>
            
            <button
              type="button"
              onClick={toggleLowStockOnly}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                filters.lowStockOnly 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Low Stock Only
            </button>
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
              <select
                name="size"
                value={filters.size}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-red-500">{error}</div>
        ) : inventory.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {item.imageUrl ? (
                              <img className="h-10 w-10 rounded-full" src={item.imageUrl} alt={item.name} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.categoryName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantityInStock} {item.unitName}
                        {item.maxStockLevel && (
                          <span className="text-xs text-gray-500 ml-1">
                            (max: {item.maxStockLevel})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge product={item} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className={`flex items-center ${item.isExpired ? 'text-red-500' : ''}`}>
                          {item.expiryDate ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(item.expiryDate)}
                            </>
                          ) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openAdjustmentModal(item)}
                          className="text-blue-600 hover:text-blue-900 mr-3 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(0, filters.page - 1))}
                  disabled={filters.page === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={(filters.page + 1) * filters.size >= totalItems}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{filters.page * filters.size + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min((filters.page + 1) * filters.size, totalItems)}
                    </span>{' '}
                    of <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(0)}
                      disabled={filters.page === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">First</span>
                      «
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.max(0, filters.page - 1))}
                      disabled={filters.page === 0}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      ‹
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(totalItems / filters.size)) }, (_, i) => {
                      const pageNum = Math.max(0, Math.min(
                        Math.ceil(totalItems / filters.size) - 5,
                        filters.page - 2
                      )) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            filters.page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={(filters.page + 1) * filters.size >= totalItems}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      ›
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.ceil(totalItems / filters.size) - 1)}
                      disabled={(filters.page + 1) * filters.size >= totalItems}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Last</span>
                      »
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Adjustment Modal */}
      {adjustmentModal && currentProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-800">Inventory Adjustment</h2>
                <button
                  onClick={closeAdjustmentModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12">
                    {currentProduct.imageUrl ? (
                      <img className="h-12 w-12 rounded-full" src={currentProduct.imageUrl} alt={currentProduct.name} />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                        {currentProduct.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{currentProduct.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-semibold mr-2">Current Stock:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentProduct.quantityInStock <= currentProduct.lowStockThreshold
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {currentProduct.quantityInStock} {currentProduct.unitName}
                      </span>
                      {currentProduct.lowStockThreshold && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Low threshold: {currentProduct.lowStockThreshold})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`py-2 px-4 font-medium text-sm ${!showHistory ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className={`py-2 px-4 font-medium text-sm ${showHistory ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Adjustment History
                  </button>
                </div>

                {!showHistory ? (
                  <form onSubmit={handleAdjustmentSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <label htmlFor="adjustmentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                          Adjustment Amount *
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">
                              {adjustmentData.adjustmentAmount > 0 ? '+' : ''}
                            </span>
                          </div>
                          <input
                            type="number"
                            id="adjustmentAmount"
                            name="adjustmentAmount"
                            value={adjustmentData.adjustmentAmount}
                            onChange={handleAdjustmentChange}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">
                              {currentProduct.unitName}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Positive number to add stock, negative to remove
                        </p>
                        <div className="mt-2">
                          <p className="text-sm">
                            New stock will be: <span className="font-semibold">
                              {currentProduct.quantityInStock + adjustmentData.adjustmentAmount}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Adjustment *
                        </label>
                        <select
                          id="reason"
                          name="reason"
                          value={adjustmentData.reason}
                          onChange={handleAdjustmentChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md"
                          required
                        >
                          <option value="">Select a reason</option>
                          <option value="Damaged Goods">Damaged Goods</option>
                          <option value="Expired Products">Expired Products</option>
                          <option value="Inventory Correction">Inventory Correction</option>
                          <option value="Received Shipment">Received Shipment</option>
                          <option value="Theft/Loss">Theft/Loss</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {adjustmentData.reason === 'Other' && (
                      <div className="mb-4">
                        <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Reason *
                        </label>
                        <input
                          type="text"
                          id="customReason"
                          name="reason"
                          value={adjustmentData.reason}
                          onChange={handleAdjustmentChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md"
                          required={adjustmentData.reason === 'Other'}
                        />
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="createSupplierOrder"
                          name="createSupplierOrder"
                          checked={adjustmentData.createSupplierOrder}
                          onChange={handleAdjustmentChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="createSupplierOrder" className="ml-2 block text-sm text-gray-700">
                          Create Supplier Order
                        </label>
                      </div>
                      {adjustmentData.createSupplierOrder && (
                        <div className="mt-4 ml-6">
                          <label htmlFor="orderQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Order Quantity *
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <input
                              type="number"
                              id="orderQuantity"
                              name="orderQuantity"
                              value={adjustmentData.orderQuantity}
                              onChange={handleAdjustmentChange}
                              min="1"
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
                              required={adjustmentData.createSupplierOrder}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                {currentProduct.unitName}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={closeAdjustmentModal}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save Adjustment
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Adjustment History</h3>
                    {adjustmentHistory.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No adjustment history found for this product
                      </div>
                    ) : (
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Stock</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {adjustmentHistory.map((adjustment) => (
                              <tr key={adjustment.id}>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDateTime(adjustment.adjustmentDate)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                  <AdjustmentTypeBadge amount={adjustment.adjustmentAmount} />
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {adjustment.newStockLevel} {currentProduct.unitName}
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-500">
                                  {adjustment.reason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowHistory(false)}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Back to Adjustment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;