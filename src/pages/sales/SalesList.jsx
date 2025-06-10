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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sales Records</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer"
          className="p-2 border rounded w-64"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border rounded"
        />
        
        <button 
          onClick={exportCSV} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading sales...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
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

          <div className="bg-white rounded shadow overflow-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="p-3 border">#</th>
                  <th className="p-3 border">Customer</th>
                  <th className="p-3 border">Items</th>
                  <th className="p-3 border">Total</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">Date</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageSales.length > 0 ? (
                  pageSales.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="p-3 border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 border">
                        {sale.customerName || (sale.customer && sale.customer.name) || 'N/A'}
                      </td>
                      <td className="p-3 border">
                        {sale.items ? sale.items.length : 0}
                      </td>
                      <td className="p-3 border">
                        Ksh {sale.total ? sale.total.toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border capitalize">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          sale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-3 border">
                        {new Date(sale.saleDate).toLocaleString()}
                      </td>
                      <td className="p-3 border">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => { 
                              setModalSale(sale); 
                              setModalType('details'); 
                            }} 
                            className="text-blue-600 underline"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => handleGenerateReceipt(sale.id)}
                            className="text-purple-600 underline"
                          >
                            Receipt
                          </button>
                          {sale.status !== 'CANCELLED' && (
                            <button 
                              onClick={() => handleCancelSale(sale.id)}
                              className="text-red-600 underline"
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
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {modalSale && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl relative" ref={printRef}>
                <button 
                  onClick={() => setModalSale(null)} 
                  className="absolute top-2 right-3 text-gray-500 text-xl"
                >
                  &times;
                </button>

                {modalType === 'details' && (
                  <>
                    <h2 className="text-xl font-bold mb-4">Sale Details</h2>
                    <p><strong>Sale ID:</strong> {modalSale.id}</p>
                    <p><strong>Date:</strong> {new Date(modalSale.saleDate).toLocaleString()}</p>
                    <p><strong>Customer:</strong> {modalSale.customerName || (modalSale.customer && modalSale.customer.name) || 'N/A'}</p>
                    <p><strong>Status:</strong> {modalSale.status}</p>
                    <p><strong>Subtotal:</strong> Ksh {modalSale.subtotal?.toFixed(2) || '0.00'}</p>
                    <p><strong>Tax:</strong> Ksh {modalSale.taxAmount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Discount:</strong> Ksh {modalSale.discountAmount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Total:</strong> Ksh {modalSale.total?.toFixed(2) || '0.00'}</p>
                    
                    <div className="mt-4">
                      <p className="font-semibold mb-1">Items:</p>
                      <ul className="list-disc pl-5">
                        {modalSale.items?.map((item, idx) => (
                          <li key={idx}>
                            {item.productName} x {item.quantity} - 
                            Ksh {item.totalPrice?.toFixed(2) || '0.00'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {modalType === 'receipt' && (
                  <>
                    <h2 className="text-xl font-bold mb-4 text-center">RECEIPT</h2>
                    <div className="text-center mb-4">
                      <p className="font-bold">Your Business Name</p>
                      <p className="text-sm">Business Address</p>
                      <p className="text-sm">Contact: +254700000000</p>
                    </div>
                    
                    <div className="border-t border-b py-2 my-2">
                      <p><strong>Receipt No:</strong> {modalSale.receiptNumber || modalSale.id}</p>
                      <p><strong>Date:</strong> {new Date(modalSale.saleDate).toLocaleString()}</p>
                      <p><strong>Customer:</strong> {modalSale.customerName || 'Walk-in Customer'}</p>
                      <p><strong>Status:</strong> {modalSale.status}</p>
                    </div>
                    
                    <table className="w-full my-2">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left">Item</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalSale.items?.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td>{item.productName}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">{item.unitPrice?.toFixed(2) || '0.00'}</td>
                            <td className="text-right">{item.totalPrice?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="mt-4 text-right">
                      <p><strong>Subtotal:</strong> Ksh {modalSale.subtotal?.toFixed(2) || '0.00'}</p>
                      <p><strong>Tax:</strong> Ksh {modalSale.taxAmount?.toFixed(2) || '0.00'}</p>
                      <p><strong>Discount:</strong> Ksh {modalSale.discountAmount?.toFixed(2) || '0.00'}</p>
                      <p className="text-lg font-bold">
                        <strong>Total:</strong> Ksh {modalSale.total?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="mt-6 text-center text-xs">
                      <p>Thank you for your business!</p>
                      <p>Items can be returned within 7 days with receipt</p>
                    </div>
                  </>
                )}
                
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Print
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