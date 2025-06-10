import React, { useState, useEffect } from 'react';
import { InventoryService } from '../../services/InventoryService';
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    createSupplierOrder: false,
    orderQuantity: 0
  });

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getInventoryStatus({
        search: filters.search,
        expiredOnly: filters.expiredOnly,
        lowStockOnly: filters.lowStockOnly,
        page: filters.page,
        size: filters.size
      });
      setInventory(response.content);
      setTotalItems(response.totalElements);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInventory();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      page: 0 // Reset to first page when filters change
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
      createSupplierOrder: false,
      orderQuantity: 0
    });
    setAdjustmentModal(true);
  };

  // Close adjustment modal
  const closeAdjustmentModal = () => {
    setAdjustmentModal(false);
    setCurrentProduct(null);
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
      await InventoryService.adjustInventory({
        productId: currentProduct.id,
        ...adjustmentData
      });
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

  // Status badge component
  const StatusBadge = ({ product }) => {
    const now = new Date();
    const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
    
    if (expiryDate && expiryDate < now) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Expired
        </span>
      );
    }
    
    if (product.quantity <= product.lowStockThreshold) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your product inventory in real-time
          </p>
        </div>
        <button
          onClick={handleRemoveExpired}
          className="mt-4 md:mt-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
        >
          Remove Expired Products
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="expiredOnly"
              name="expiredOnly"
              checked={filters.expiredOnly}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="expiredOnly" className="ml-2 block text-sm text-gray-700">
              Show Expired Only
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="lowStockOnly"
              name="lowStockOnly"
              checked={filters.lowStockOnly}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="lowStockOnly" className="ml-2 block text-sm text-gray-700">
              Show Low Stock Only
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
            <select
              name="size"
              value={filters.size}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
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
          <div className="p-6 text-gray-500">No inventory items found matching your criteria</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                            <div className="text-sm text-gray-500">{item.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`font-semibold ${item.quantity <= item.lowStockThreshold ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {item.quantity}
                        </span>
                        {item.quantity <= item.lowStockThreshold && (
                          <span className="ml-1 text-xs text-yellow-600">(Low: {item.lowStockThreshold})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.expiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge product={item} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openAdjustmentModal(item)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
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
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={(filters.page + 1) * filters.size >= totalItems}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-800">Adjust Inventory</h2>
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
                    <p className="text-sm text-gray-500">Current: {currentProduct.quantity}</p>
                  </div>
                </div>

                <form onSubmit={handleAdjustmentSubmit}>
                  <div className="mb-4">
                    <label htmlFor="adjustmentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustment Amount
                    </label>
                    <input
                      type="number"
                      id="adjustmentAmount"
                      name="adjustmentAmount"
                      value={adjustmentData.adjustmentAmount}
                      onChange={handleAdjustmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use positive numbers to add stock, negative to remove
                    </p>
                  </div>

                  <div className="mb-4">
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
                  </div>

                  {adjustmentData.createSupplierOrder && (
                    <div className="mb-4">
                      <label htmlFor="orderQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Quantity
                      </label>
                      <input
                        type="number"
                        id="orderQuantity"
                        name="orderQuantity"
                        value={adjustmentData.orderQuantity}
                        onChange={handleAdjustmentChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={adjustmentData.createSupplierOrder}
                      />
                    </div>
                  )}

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
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;