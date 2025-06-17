import React, { useState, useEffect } from 'react';
import { getAllPurchases } from '../../services/purchaseService';
import { getSuppliers, getSupplierDetails } from '../../services/supplierService';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SupplierPurchasesReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    supplierId: '',
    startDate: null,
    endDate: null,
    status: ''
  });
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [supplierDetailsCache, setSupplierDetailsCache] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [purchasesData, suppliersData] = await Promise.all([
          getAllPurchases(),
          getSuppliers()
        ]);
        
        // Validate and filter suppliers data
        const validSuppliers = Array.isArray(suppliersData) 
          ? suppliersData.filter(s => s && (s.id || s._id)) 
          : [];
        
        setSuppliers(validSuppliers);
        
        // Process purchases data with null checks
        const purchasesWithSupplierNames = Array.isArray(purchasesData)
          ? purchasesData
              .filter(purchase => purchase && (purchase.supplierId || purchase.supplier))
              .map(purchase => {
                const supplierId = purchase.supplierId || purchase.supplier?._id || purchase.supplier;
                const supplier = validSuppliers.find(s => 
                  s.id === supplierId || s._id === supplierId
                );

                return {
                  ...purchase,
                  supplierName: supplier ? supplier.companyName : 'Unknown Supplier',
                  supplierId: supplierId,
                  id: purchase.id || purchase._id
                };
              })
          : [];

        setPurchases(purchasesWithSupplierNames);
        setFilteredPurchases(purchasesWithSupplierNames);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load data');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, purchases]);

  const applyFilters = () => {
    let result = [...purchases];

    if (filters.supplierId) {
      result = result.filter(p => p.supplierId === filters.supplierId);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(p => p.orderDate && new Date(p.orderDate) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(p => p.orderDate && new Date(p.orderDate) <= endDate);
    }

    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    setFilteredPurchases(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, field) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const resetFilters = () => {
    setFilters({
      supplierId: '',
      startDate: null,
      endDate: null,
      status: ''
    });
  };

  const toggleSupplierExpansion = async (supplierId) => {
    if (!supplierId) {
      setError('Invalid supplier ID');
      return;
    }

    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null);
      return;
    }

    try {
      setLoading(true);
      const details = await getSupplierDetails(supplierId);
      if (details) {
        setSupplierDetailsCache(prev => ({
          ...prev,
          [supplierId]: details
        }));
        setExpandedSupplier(supplierId);
      } else {
        throw new Error('No supplier details returned');
      }
    } catch (err) {
      setError(`Failed to fetch supplier details: ${err.message}`);
      console.error('Error fetching supplier details:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    try {
      setPdfLoading(true);
      const doc = new jsPDF();
      
      // Report title
      doc.setFontSize(18);
      doc.text('Supplier Purchases Report', 14, 22);
      
      // Filters information
      doc.setFontSize(10);
      let yPosition = 32;
      
      if (filters.supplierId) {
        const supplier = suppliers.find(s => s.id === filters.supplierId || s._id === filters.supplierId);
        doc.text(`Supplier: ${supplier ? supplier.companyName : filters.supplierId}`, 14, yPosition);
        yPosition += 6;
      }
      
      if (filters.startDate) {
        doc.text(`From: ${format(new Date(filters.startDate), 'MM/dd/yyyy')}`, 14, yPosition);
        yPosition += 6;
      }
      
      if (filters.endDate) {
        doc.text(`To: ${format(new Date(filters.endDate), 'MM/dd/yyyy')}`, 14, yPosition);
        yPosition += 6;
      }
      
      if (filters.status) {
        doc.text(`Status: ${filters.status}`, 14, yPosition);
        yPosition += 6;
      }
      
      // Generate table with null checks
      const tableData = filteredPurchases.map(purchase => [
        purchase.id || 'N/A',
        purchase.supplierName || 'Unknown',
        purchase.orderDate ? format(new Date(purchase.orderDate), 'MM/dd/yyyy') : 'N/A',
        `KSH ${purchase.totalAmount?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
        purchase.status ? purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1) : 'N/A',
        purchase.items?.length || 0
      ]);
      
      autoTable(doc, {
        startY: yPosition + 10,
        head: [['ID', 'Supplier', 'Date', 'Amount (KSH)', 'Status', 'Items']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: yPosition + 10 }
      });
      
      // Summary statistics with null checks
      const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const avgAmount = filteredPurchases.length > 0 ? totalAmount / filteredPurchases.length : 0;
      
      doc.setFontSize(12);
      doc.text(`Total Purchases: ${filteredPurchases.length}`, 14, doc.lastAutoTable.finalY + 15);
      doc.text(`Total Amount: KSH ${totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        14, doc.lastAutoTable.finalY + 25);
      doc.text(`Average Purchase: KSH ${avgAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        14, doc.lastAutoTable.finalY + 35);
      
      doc.save('supplier_purchases_report.pdf');
    } catch (err) {
      setError('Failed to generate PDF report. Please try again.');
      console.error('PDF generation error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading && !expandedSupplier) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={() => setError(null)} 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Dismiss error"
        >
          <svg className="fill-current h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Supplier Purchases Report</h1>
        
        {/* Filters Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="supplier-filter" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                id="supplier-filter"
                name="supplierId"
                value={filters.supplierId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                aria-label="Filter by supplier"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id || supplier._id} value={supplier.id || supplier._id}>
                    {supplier.companyName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status-filter"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                placeholderText="Select start date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                aria-label="Filter by start date"
              />
            </div>
            
            <div>
              <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                selectsEnd
                startDate={filters.startDate}
                endDate={filters.endDate}
                minDate={filters.startDate}
                placeholderText="Select end date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                aria-label="Filter by end date"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={resetFilters}
              className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
              aria-label="Reset filters"
            >
              Reset Filters
            </button>
            <button
              onClick={generatePDFReport}
              disabled={pdfLoading || filteredPurchases.length === 0}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              aria-label="Generate PDF report"
            >
              {pdfLoading ? 'Generating...' : 'Generate PDF Report'}
            </button>
          </div>
        </div>
        
        {/* Report Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-600">Total Purchases</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-800">{filteredPurchases.length}</p>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600">Total Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-green-800">
                KSH {filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-KE', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-purple-600">Average Purchase</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-800">
                KSH {filteredPurchases.length > 0 
                  ? (filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0) / filteredPurchases.length).toLocaleString('en-KE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Purchases Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200" aria-label="Supplier purchases table">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">Items</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map(purchase => (
                  <React.Fragment key={purchase.id || purchase._id || Math.random()}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer" 
                      onClick={() => toggleSupplierExpansion(purchase.supplierId)}
                      aria-expanded={expandedSupplier === purchase.supplierId}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{purchase.id || purchase._id}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {purchase.supplierName}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {purchase.orderDate ? format(new Date(purchase.orderDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <span className="sm:hidden">KSH </span>
                        {purchase.totalAmount?.toLocaleString('en-KE', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        }) || '0.00'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${purchase.status === 'received' ? 'bg-green-100 text-green-800' : 
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {purchase.status ? purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden xs:table-cell">
                        {purchase.items?.length || 0}
                      </td>
                    </tr>
                    
                    {expandedSupplier === purchase.supplierId && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-3 sm:px-6 py-4">
                          <div className="mb-4">
                            <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-2">Supplier Details</h3>
                            {supplierDetailsCache[purchase.supplierId] ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm"><span className="font-medium">Company:</span> {supplierDetailsCache[purchase.supplierId].companyName || 'N/A'}</p>
                                  <p className="text-xs sm:text-sm"><span className="font-medium">Contact:</span> {supplierDetailsCache[purchase.supplierId].contactPerson || 'N/A'}</p>
                                  <p className="text-xs sm:text-sm"><span className="font-medium">Email:</span> {supplierDetailsCache[purchase.supplierId].email || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm"><span className="font-medium">Phone:</span> {supplierDetailsCache[purchase.supplierId].phone || 'N/A'}</p>
                                  <p className="text-xs sm:text-sm"><span className="font-medium">Address:</span> {supplierDetailsCache[purchase.supplierId].address || 'N/A'}</p>
                                  <p className="text-xs sm:text-sm"><span className="font-medium">Rating:</span> {supplierDetailsCache[purchase.supplierId].rating || 'N/A'}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center items-center py-2 sm:py-4">
                                <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-t-2 border-b-2 border-blue-500"></div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-2">Purchased Items</h3>
                            {purchase.items?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm" aria-label="Purchased items table">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th scope="col" className="px-2 sm:px-4 py-1 sm:py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                      <th scope="col" className="px-2 sm:px-4 py-1 sm:py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                      <th scope="col" className="px-2 sm:px-4 py-1 sm:py-2 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Unit Price</th>
                                      <th scope="col" className="px-2 sm:px-4 py-1 sm:py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {purchase.items.map((item, index) => (
                                      <tr key={`${purchase.id}-${item.productId || index}`}>
                                        <td className="px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap font-medium text-gray-900">
                                          {item.productName || `Product ID: ${item.productId || 'N/A'}`}
                                        </td>
                                        <td className="px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-gray-500">{item.quantity || 0}</td>
                                        <td className="px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-gray-500 hidden sm:table-cell">
                                          KSH {item.unitPrice?.toLocaleString('en-KE', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                          }) || '0.00'}
                                        </td>
                                        <td className="px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-gray-500">
                                          KSH {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-KE', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                          })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs sm:text-sm">No items available for this purchase</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
                    {loading ? 'Loading purchases...' : 'No purchases found matching your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierPurchasesReport;