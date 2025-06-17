import React, { useEffect, useState, useRef } from 'react';
import { 
  getSales, 
  getSalesByDateRange, 
  getSalesByStatus, 
  generateReceipt, 
  cancelSale,
  exportSalesToCSV
} from '../../services/salesService';
import { saveAs } from 'file-saver';

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalSale, setModalSale] = useState(null);
  const [modalType, setModalType] = useState('invoice');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;
  const printRef = useRef();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        let data;
        if (startDate && endDate) {
          data = await getSalesByDateRange(new Date(startDate), new Date(endDate));
        } else if (statusFilter) {
          data = await getSalesByStatus(statusFilter);
        } else {
          data = await getSales();
        }
        
        const sorted = data.reverse();
        setSales(sorted);
        setFilteredSales(sorted);
      } catch (err) {
        console.error('Failed to load sales', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    let result = [...sales];
    
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(sale =>
        (sale.customerName && sale.customerName.toLowerCase().includes(lower)) ||
        (sale.customer && sale.customer.name && sale.customer.name.toLowerCase().includes(lower))
      );
    }

    setFilteredSales(result);
    setCurrentPage(1);
  }, [search, sales]);

  const handleCancelSale = async (id) => {
    if (window.confirm('Are you sure you want to cancel this sale?')) {
      try {
        await cancelSale(id);
        const updatedSales = sales.map(sale => 
          sale.id === id ? { ...sale, status: 'CANCELLED' } : sale
        );
        setSales(updatedSales);
        alert('Sale cancelled successfully');
      } catch (err) {
        console.error('Failed to cancel sale', err);
        alert('Failed to cancel sale');
      }
    }
  };

  const handleGenerateReceipt = async (id) => {
    try {
      const receipt = await generateReceipt(id);
      setModalSale(receipt);
      setModalType('receipt');
    } catch (err) {
      console.error('Failed to generate receipt', err);
      alert('Failed to generate receipt');
    }
  };

  const totals = filteredSales.reduce(
    (acc, sale) => {
      if (sale.status === 'COMPLETED') {
        acc.completed += sale.total;
      } else if (sale.status === 'CANCELLED') {
        acc.cancelled += sale.total;
      }
      acc.all += sale.total || 0;
      return acc;
    },
    { completed: 0, cancelled: 0, all: 0 }
  );

  const exportCSV = () => {
    exportSalesToCSV(filteredSales);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const pageSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sales Records</h1>

      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-between"
        >
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          <svg 
            className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filters - hidden on mobile unless toggled */}
      <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer"
            className="p-2 border rounded w-full"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
          
          <button 
            onClick={exportCSV} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white shadow rounded p-4 text-center">
              <p className="text-sm text-gray-500">Completed Sales</p>
              <p className="text-lg font-bold text-green-600">
                Ksh {totals.completed.toFixed(2)}
              </p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
              <p className="text-sm text-gray-500">Cancelled Sales</p>
              <p className="text-lg font-bold text-red-600">
                Ksh {totals.cancelled.toFixed(2)}
              </p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-lg font-bold text-gray-800">
                Ksh {totals.all.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="p-3 border hidden sm:table-cell">#</th>
                  <th className="p-3 border">Customer</th>
                  <th className="p-3 border hidden sm:table-cell">Items</th>
                  <th className="p-3 border">Total</th>
                  <th className="p-3 border hidden sm:table-cell">Status</th>
                  <th className="p-3 border hidden md:table-cell">Date</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageSales.length > 0 ? (
                  pageSales.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="p-3 border hidden sm:table-cell">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 border">
                        <div className="font-medium">
                          {sale.customerName || (sale.customer && sale.customer.name) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3 border hidden sm:table-cell">
                        {sale.items ? sale.items.length : 0}
                      </td>
                      <td className="p-3 border font-medium">
                        Ksh {sale.total ? sale.total.toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          sale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-3 border hidden md:table-cell">
                        {new Date(sale.saleDate).toLocaleString()}
                      </td>
                      <td className="p-3 border">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => { 
                              setModalSale(sale); 
                              setModalType('details'); 
                            }} 
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => handleGenerateReceipt(sale.id)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Receipt
                          </button>
                          {sale.status !== 'CANCELLED' && (
                            <button 
                              onClick={() => handleCancelSale(sale.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">
                      No matching sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {modalSale && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl relative" ref={printRef}>
                <button 
                  onClick={() => setModalSale(null)} 
                  className="absolute top-2 right-3 text-gray-500 text-xl hover:text-gray-700"
                >
                  &times;
                </button>

                {modalType === 'details' && (
                  <>
                    <h2 className="text-xl font-bold mb-4">Sale Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="font-semibold">Sale ID:</p>
                        <p>{modalSale.id}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Date:</p>
                        <p>{new Date(modalSale.saleDate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Customer:</p>
                        <p>{modalSale.customerName || (modalSale.customer && modalSale.customer.name) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Status:</p>
                        <p className={`inline-block px-2 py-1 rounded-full text-xs ${
                          modalSale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          modalSale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          modalSale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {modalSale.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="font-semibold">Subtotal:</p>
                        <p>Ksh {modalSale.subtotal?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Tax:</p>
                        <p>Ksh {modalSale.taxAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Discount:</p>
                        <p>Ksh {modalSale.discountAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-1">Total:</p>
                      <p className="text-xl font-bold">Ksh {modalSale.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2 border-b pb-1">Items:</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Item</th>
                              <th className="text-right p-2">Qty</th>
                              <th className="text-right p-2">Price</th>
                              <th className="text-right p-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalSale.items?.map((item, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="p-2">{item.productName}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">Ksh {item.unitPrice?.toFixed(2) || '0.00'}</td>
                                <td className="p-2 text-right">Ksh {item.totalPrice?.toFixed(2) || '0.00'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'receipt' && (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold mb-1">YOUR BUSINESS NAME</h2>
                      <p className="text-sm">123 Business Street, City</p>
                      <p className="text-sm">Phone: +254700000000 | Email: business@example.com</p>
                      <p className="text-sm mt-2">TAX ID: 123456789</p>
                    </div>
                    
                    <div className="border-t border-b py-3 my-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">Receipt No:</span>
                        <span>{modalSale.receiptNumber || modalSale.id}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">Date:</span>
                        <span>{new Date(modalSale.saleDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Customer:</span>
                        <span>{modalSale.customerName || 'Walk-in Customer'}</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full my-3">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Item</th>
                            <th className="text-right p-2">Qty</th>
                            <th className="text-right p-2">Price</th>
                            <th className="text-right p-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalSale.items?.map((item, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{item.productName}</td>
                              <td className="p-2 text-right">{item.quantity}</td>
                              <td className="p-2 text-right">Ksh {item.unitPrice?.toFixed(2) || '0.00'}</td>
                              <td className="p-2 text-right">Ksh {item.totalPrice?.toFixed(2) || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 text-right">
                      <div className="flex justify-between">
                        <span className="font-semibold">Subtotal:</span>
                        <span>Ksh {modalSale.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Tax:</span>
                        <span>Ksh {modalSale.taxAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Discount:</span>
                        <span>Ksh {modalSale.discountAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold">Ksh {modalSale.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-center text-xs">
                      <p>Thank you for your business!</p>
                      <p className="mt-1">Items can be returned within 7 days with receipt</p>
                      <p className="mt-2">This is a computer generated receipt - no signature required</p>
                    </div>
                  </>
                )}
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}