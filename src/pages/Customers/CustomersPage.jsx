import React, { useState, useEffect, useRef } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentArrowDownIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import {
  getAllCustomers,
  deleteCustomer,
  searchCustomers
} from '../../services/customerService';
import CustomerForm from './CustomerForm';
import Spinner from './Spinner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CustomersPage = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [notification, setNotification] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const componentRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle location state for notifications
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.success ? 'success' : 'error'
      });
      // Clear the location state
      navigate(location.pathname, { replace: true, state: {} });
      
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllCustomers();
      setCustomers(response.data || response); // Handle both array and object responses
      setFilteredCustomers(response.data || response);
    } catch (err) {
      setError('Failed to fetch customers. Please try again.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      applyFilters();
      return;
    }
    try {
      setLoading(true);
      const response = await searchCustomers(searchTerm);
      const data = response.data || response;
      setFilteredCustomers(data);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...customers];

    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(customer => {
        const createdAt = customer.createdAt || customer.created_at;
        if (!createdAt) return true;
        
        try {
          const customerDate = new Date(createdAt);
          if (isNaN(customerDate.getTime())) return true;
          
          const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
          const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
          
          if (start && end) {
            return customerDate >= start && customerDate <= end;
          } else if (start) {
            return customerDate >= start;
          } else if (end) {
            return customerDate <= end;
          }
        } catch (e) {
          console.error('Error filtering by date:', e);
          return true;
        }
        
        return true;
      });
    }

    setFilteredCustomers(filtered);
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredCustomers(sortedCustomers);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter(customer => customer.id !== id));
      setFilteredCustomers(filteredCustomers.filter(customer => customer.id !== id));
      showNotification('Customer deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('Failed to delete customer.', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Handle form success
  const handleFormSuccess = (message) => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
    showNotification(message || 'Customer saved successfully!', 'success');
  };

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        button, form, .no-print { display: none !important; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
      }
    `,
    documentTitle: 'Customers Report'
  });

  // Excel export
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredCustomers.map(customer => ({
      ID: customer.id,
      Name: customer.name,
      Email: customer.email || 'N/A',
      Phone: customer.phone || 'N/A',
      Address: customer.address || 'N/A',
      'Created At': formatCreatedAt(customer.createdAt || customer.created_at)
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

  // Format date
  const formatCreatedAt = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    applyFilters();
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm md:text-base flex items-center"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
            <CSVLink 
              data={filteredCustomers.map(customer => ({
                ID: customer.id,
                Name: customer.name,
                Email: customer.email || 'N/A',
                Phone: customer.phone || 'N/A',
                Address: customer.address || 'N/A',
                'Created At': formatCreatedAt(customer.createdAt || customer.created_at)
              }))} 
              filename={"customers.csv"}
              className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm md:text-base flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              CSV
            </CSVLink>
            <button
              onClick={handleExcelDownload}
              className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm md:text-base flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Excel
            </button>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="px-3 py-2 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm md:text-base flex items-center"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    applyFilters();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm flex items-center"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Search
              </button>
              <button
                onClick={fetchCustomers}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm flex items-center"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm flex items-center"
              >
                {expandedFilters ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4 mr-2" />
                    Hide Filters
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4 mr-2" />
                    More Filters
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {expandedFilters && (
            <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="flex items-center gap-2 w-full">
                  <DatePicker
                    selected={startDate}
                    onChange={date => {
                      setStartDate(date);
                      applyFilters();
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto text-sm"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <DatePicker
                    selected={endDate}
                    onChange={date => {
                      setEndDate(date);
                      applyFilters();
                    }}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="End Date"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto text-sm"
                  />
                </div>
                {(startDate || endDate) && (
                  <button 
                    onClick={clearDateFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-800 w-full sm:w-auto text-center sm:text-left"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-center mb-2">Customers Report</h1>
        {startDate || endDate ? (
          <p className="text-center text-sm">
            {startDate && `From: ${startDate.toLocaleDateString()}`}
            {startDate && endDate && ' to '}
            {endDate && `To: ${endDate.toLocaleDateString()}`}
          </p>
        ) : null}
        <p className="text-center text-sm">
          Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div ref={componentRef}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('id')}
                  >
                    <div className="flex items-center">
                      ID
                      {sortConfig.key === 'id' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortConfig.key === 'name' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortConfig.key === 'email' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => requestSort('phone')}
                  >
                    <div className="flex items-center">
                      Phone
                      {sortConfig.key === 'phone' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    Address
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Created At
                      {sortConfig.key === 'createdAt' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider no-print">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Spinner size="md" />
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center">
                      <div className="text-gray-500 text-sm">
                        {searchTerm || startDate || endDate 
                          ? 'No customers match your search criteria' 
                          : 'No customers found'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100">
                            <span className="text-indigo-600 text-xs font-medium">
                              {customer.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{customer.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {customer.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {customer.phone || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate hidden lg:table-cell">
                        {customer.address || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {formatCreatedAt(customer.createdAt || customer.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium no-print">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setShowForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <CustomerForm 
                customer={editingCustomer} 
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCustomer(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;