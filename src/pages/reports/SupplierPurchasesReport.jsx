import React, { useState, useEffect } from 'react';
import { getAllPurchases } from '../../services/purchaseService';
import { getSuppliers } from '../../services/supplierService';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SupplierPurchasesReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    supplierId: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [expandedSupplier, setExpandedSupplier] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [purchasesData, suppliersData] = await Promise.all([
          getAllPurchases(),
          getSuppliers()
        ]);
        
        // Map supplier details to each purchase
        const purchasesWithSupplierNames = purchasesData.map(purchase => {
          const supplier = suppliersData.find(s => s.id === purchase.supplierId);
          return {
            ...purchase,
            supplierName: supplier ? supplier.companyName : '',
            supplierDetails: supplier || null
          };
        });

        setPurchases(purchasesWithSupplierNames);
        setSuppliers(suppliersData);
        setFilteredPurchases(purchasesWithSupplierNames);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
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
      result = result.filter(p => new Date(p.orderDate) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      result = result.filter(p => new Date(p.orderDate) <= new Date(filters.endDate));
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

  const resetFilters = () => {
    setFilters({
      supplierId: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    setFilteredPurchases(purchases);
  };

  const toggleSupplierExpansion = (supplierId) => {
    setExpandedSupplier(expandedSupplier === supplierId ? null : supplierId);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Report title
    doc.setFontSize(18);
    doc.text('Supplier Purchases Report', 14, 22);
    
    // Filters information
    doc.setFontSize(10);
    let yPosition = 32;
    
    if (filters.supplierId) {
      const supplier = suppliers.find(s => s.id === filters.supplierId);
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
    
    // Generate table
    const tableData = filteredPurchases.map(purchase => {
      return [
        purchase.id,
        purchase.supplierName,
        format(new Date(purchase.orderDate), 'MM/dd/yyyy'),
        `KSH ${purchase.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1),
        purchase.items.length
      ];
    });
    
    doc.autoTable({
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
    
    // Summary statistics
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const avgAmount = filteredPurchases.length > 0 ? totalAmount / filteredPurchases.length : 0;
    
    doc.setFontSize(12);
    doc.text(`Total Purchases: ${filteredPurchases.length}`, 14, doc.lastAutoTable.finalY + 15);
    doc.text(`Total Amount: KSH ${totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      14, doc.lastAutoTable.finalY + 25);
    doc.text(`Average Purchase: KSH ${avgAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      14, doc.lastAutoTable.finalY + 35);
    
    doc.save('supplier_purchases_report.pdf');
  };

  if (loading) {
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Supplier Purchases Report</h1>
      
      {/* Filters Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              name="supplierId"
              value={filters.supplierId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-3">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Filters
          </button>
          <button
            onClick={generatePDFReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate PDF Report
          </button>
        </div>
      </div>
      
      {/* Report Summary */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Purchases</p>
            <p className="text-2xl font-bold text-blue-800">{filteredPurchases.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Total Amount</p>
            <p className="text-2xl font-bold text-green-800">
              KSH {filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString('en-KE', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Average Purchase</p>
            <p className="text-2xl font-bold text-purple-800">
              KSH {filteredPurchases.length > 0 
                ? (filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0) / filteredPurchases.length).toLocaleString('en-KE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                : "0.00"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Purchases Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (KSH)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map(purchase => (
                  <React.Fragment key={purchase.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleSupplierExpansion(purchase.supplierId)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {purchase.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(purchase.orderDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        KSH {purchase.totalAmount.toLocaleString('en-KE', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${purchase.status === 'received' ? 'bg-green-100 text-green-800' : 
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.items.length}
                      </td>
                    </tr>
                    
                    {expandedSupplier === purchase.supplierId && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Supplier Details</h3>
                            {purchase.supplierDetails ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p><span className="font-medium">Company:</span> {purchase.supplierDetails.companyName}</p>
                                  <p><span className="font-medium">Contact:</span> {purchase.supplierDetails.contactPerson}</p>
                                  <p><span className="font-medium">Email:</span> {purchase.supplierDetails.email}</p>
                                </div>
                                <div>
                                  <p><span className="font-medium">Phone:</span> {purchase.supplierDetails.phone}</p>
                                  <p><span className="font-medium">Address:</span> {purchase.supplierDetails.address}</p>
                                </div>
                              </div>
                            ) : (
                              <p>No supplier details available</p>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Purchased Items</h3>
                            {purchase.items?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {purchase.items.map(item => (
                                      <tr key={item.productId}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {item.productName || `Product ID: ${item.productId}`}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          KSH {item.unitPrice.toLocaleString('en-KE', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                          })}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          KSH {(item.quantity * item.unitPrice).toLocaleString('en-KE', { 
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
                              <p>No items available for this purchase</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No purchases found matching your filters
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