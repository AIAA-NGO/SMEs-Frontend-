import React, { useEffect, useState, useRef } from 'react';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { 
  addSupplier, 
  getSuppliers, 
  updateSupplier, 
  deleteSupplier 
} from '../../services/supplierService';
import { getAllCategories } from '../../services/categories';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [categories, setCategories] = useState([]);
  const componentRef = useRef();

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    rating: '',
    categoryIds: []
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data.content || data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSuppliers();
      setSuppliers(data.content || data);
    } catch (err) {
      setError('Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
    setFormData(prev => ({ ...prev, categoryIds: selected }));
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      rating: '',
      categoryIds: []
    });
    setEditingSupplier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const supplierData = {
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        website: formData.website || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        categoryIds: formData.categoryIds
      };

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierData);
        setSuccess('Supplier updated successfully!');
      } else {
        await addSupplier(supplierData);
        setSuccess('Supplier created successfully!');
      }
      
      resetForm();
      setShowForm(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    }
  };

  // Edit supplier
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      companyName: supplier.companyName || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      website: supplier.website || '',
      rating: supplier.rating ? supplier.rating.toString() : '',
      categoryIds: supplier.categories?.map(c => c.id) || []
    });
    setShowForm(true);
  };

  // Delete supplier
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        setSuccess('Supplier deleted successfully!');
        fetchSuppliers();
      } catch (err) {
        setError('Failed to delete supplier');
      }
    }
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
    documentTitle: 'Suppliers Report'
  });

  // Excel download
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredSuppliers.map(supplier => ({
      'Company Name': supplier.companyName,
      'Contact Person': supplier.contactPerson,
      'Email': supplier.email || 'N/A',
      'Phone': supplier.phone || 'N/A',
      'Address': supplier.address || 'N/A',
      'Website': supplier.website || 'N/A',
      'Rating': supplier.rating || 'N/A',
      'Categories': supplier.categories?.map(c => c.name).join(', ') || 'N/A',
      'Created At': formatDate(supplier.createdAt),
      'Updated At': formatDate(supplier.updatedAt)
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
    XLSX.writeFile(workbook, "suppliers.xlsx");
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  // Render star rating
  const renderRating = (rating) => {
    if (rating === null || rating === undefined) return 'N/A';
    
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half-star" x1="0" x2="100%" y1="0" y2="0">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{numericRating.toFixed(1)}</span>
      </div>
    );
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    // Filter by search term
    const matchesSearch = 
      supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by date range if dates are selected
    if (!startDate && !endDate) return matchesSearch;
    
    const createdAt = supplier.createdAt;
    if (!createdAt) return matchesSearch;
    
    try {
      const supplierDate = new Date(createdAt);
      if (isNaN(supplierDate.getTime())) return matchesSearch;
      
      const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
      const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
      
      if (start && end) {
        return matchesSearch && supplierDate >= start && supplierDate <= end;
      } else if (start) {
        return matchesSearch && supplierDate >= start;
      } else if (end) {
        return matchesSearch && supplierDate <= end;
      }
    } catch (e) {
      console.error('Error filtering by date:', e);
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow">
      <div className="no-print">
        {/* Header with Export Buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Suppliers Management</h1>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handlePrint}
              className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm md:text-base"
            >
              Print
            </button>
            <CSVLink 
              data={filteredSuppliers.map(supplier => ({
                'Company Name': supplier.companyName,
                'Contact Person': supplier.contactPerson,
                'Email': supplier.email || 'N/A',
                'Phone': supplier.phone || 'N/A',
                'Address': supplier.address || 'N/A',
                'Website': supplier.website || 'N/A',
                'Rating': supplier.rating || 'N/A',
                'Categories': supplier.categories?.map(c => c.name).join(', ') || 'N/A',
                'Created At': formatDate(supplier.createdAt),
                'Updated At': formatDate(supplier.updatedAt)
              }))} 
              filename={"suppliers.csv"}
              className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm md:text-base"
            >
              Download CSV
            </CSVLink>
            <button 
              onClick={handleExcelDownload}
              className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm md:text-base"
            >
              Download Excel
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-3 py-2 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm md:text-base"
            >
              Add Supplier
            </button>
          </div>
        </div>

        {/* Search and Date Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search suppliers..."
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
          
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex items-center gap-2 w-full">
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start Date"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full sm:w-auto"
              />
              <span className="text-gray-500">to</span>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End Date"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full sm:w-auto"
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

        {/* Status messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-center mb-2">Suppliers Report</h1>
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

      {/* Suppliers Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div ref={componentRef}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Categories</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                    {searchTerm || startDate || endDate 
                      ? 'No suppliers match your search criteria' 
                      : 'No suppliers found'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.companyName}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{supplier.email}</div>
                      <div className="text-xs text-gray-500 sm:hidden mt-1">
                        {renderRating(supplier.rating)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.contactPerson}</div>
                      <div className="text-xs text-gray-500 md:hidden">{supplier.phone}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="text-indigo-600 hover:text-indigo-900">
                          {supplier.email}
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {supplier.phone || 'N/A'}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {renderRating(supplier.rating)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                      <div className="flex flex-wrap">
                        {supplier.categories?.length > 0 ? (
                          supplier.categories.map(category => (
                            <span key={category.id} className="bg-gray-100 rounded-full px-2 py-1 text-xs mr-1 mb-1">
                              {category.name}
                            </span>
                          ))
                        ) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <div className="flex space-x-2 sm:space-x-4">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          Delete
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

      {/* Add/Edit Supplier Modal */}
      {showForm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                            Company Name *
                          </label>
                          <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                            Contact Person *
                          </label>
                          <input
                            type="text"
                            name="contactPerson"
                            id="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            id="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                            Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            id="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://example.com"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                            Rating (0-5)
                          </label>
                          <input
                            type="number"
                            name="rating"
                            id="rating"
                            min="0"
                            max="5"
                            step="0.1"
                            value={formData.rating}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700">
                            Categories *
                          </label>
                          <select
                            multiple
                            name="categoryIds"
                            id="categoryIds"
                            value={formData.categoryIds}
                            onChange={handleCategoryChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-auto min-h-[100px]"
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple categories</p>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                        >
                          {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            resetForm();
                          }}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;