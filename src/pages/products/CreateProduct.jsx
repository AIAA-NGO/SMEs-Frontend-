import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  addProduct, 
  getCategories, 
  getBrands, 
  getUnits, 
  getSuppliers,
  checkBarcodeExists,
  checkSkuExists
} from '../../services/productServices';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: '',
    costPrice: '',
    quantityInStock: '0',
    lowStockThreshold: '10',
    supplierId: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    imageFile: null,
    expiryDate: '',
  });

  // Debounce function to limit API calls during typing
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  // Check if barcode exists in database
  const validateBarcode = async (barcode) => {
    if (!barcode) return;
    
    try {
      setIsValidating(true);
      const exists = await checkBarcodeExists(barcode);
      if (exists) {
        setFormErrors(prev => ({ ...prev, barcode: 'This barcode is already in use' }));
      } else if (formErrors.barcode === 'This barcode is already in use') {
        setFormErrors(prev => ({ ...prev, barcode: undefined }));
      }
    } catch (err) {
      console.error('Error validating barcode:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Check if SKU exists in database
  const validateSku = async (sku) => {
    if (!sku) return;
    
    try {
      setIsValidating(true);
      const exists = await checkSkuExists(sku);
      if (exists) {
        setFormErrors(prev => ({ ...prev, sku: 'This SKU is already in use' }));
      } else if (formErrors.sku === 'This SKU is already in use') {
        setFormErrors(prev => ({ ...prev, sku: undefined }));
      }
    } catch (err) {
      console.error('Error validating SKU:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced versions of validation functions
  const debouncedValidateBarcode = debounce(validateBarcode, 500);
  const debouncedValidateSku = debounce(validateSku, 500);

  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [cat, brand, unit, supp] = await Promise.all([
          getCategories(),
          getBrands(),
          getUnits(),
          getSuppliers(),
        ]);
        setCategories(cat || []);
        setBrands(brand || []);
        setUnits(unit || []);
        setSuppliers(supp || []);
      } catch (err) {
        console.error('Error loading dropdowns:', err);
        setError('Failed to load required data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdowns();
  }, []);

  const validateForm = async () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Product name is required';
    if (!formData.sku?.trim()) errors.sku = 'SKU is required';
    if (!formData.supplierId) errors.supplierId = 'Supplier is required';
    if (!formData.categoryId) errors.categoryId = 'Category is required';
    if (!formData.unitId) errors.unitId = 'Unit is required';
    if (!formData.price || isNaN(formData.price)) errors.price = 'Valid price is required';
    if (formData.price && parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
    if (formData.costPrice && parseFloat(formData.costPrice) < 0) errors.costPrice = 'Cost price cannot be negative';
    if (formData.expiryDate && new Date(formData.expiryDate) <= new Date()) {
      errors.expiryDate = 'Expiry date must be in the future';
    }

    // Check for duplicates before submission
    if (formData.barcode) {
      try {
        const barcodeExists = await checkBarcodeExists(formData.barcode);
        if (barcodeExists) errors.barcode = 'This barcode is already in use';
      } catch (err) {
        console.error('Error validating barcode:', err);
      }
    }

    if (formData.sku) {
      try {
        const skuExists = await checkSkuExists(formData.sku);
        if (skuExists) errors.sku = 'This SKU is already in use';
      } catch (err) {
        console.error('Error validating SKU:', err);
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Trigger real-time validation for barcode and SKU
    if (name === 'barcode') {
      debouncedValidateBarcode(value);
    } else if (name === 'sku') {
      debouncedValidateSku(value);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed (JPEG, PNG, etc.)');
        return;
      }
  
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
  
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
  
      setFormData(prev => ({ ...prev, imageFile: file }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    setError('');
    setFormErrors({});

    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value);
        }
      });

      const response = await addProduct(formDataToSend);

      navigate('/products', { 
        state: { 
          success: `Product "${response.name}" created successfully!`,
          shouldRefresh: true
        } 
      });
    } catch (err) {
      console.error('Error creating product:', err);
      
      if (err.response?.data?.message?.includes('duplicate key value violates unique constraint')) {
        if (err.response.data.message.includes('barcode')) {
          setFormErrors(prev => ({ ...prev, barcode: 'This barcode is already in use' }));
        } else if (err.response.data.message.includes('sku')) {
          setFormErrors(prev => ({ ...prev, sku: 'This SKU is already in use' }));
        } else {
          setError('This product already exists. Please check your inputs.');
        }
      } else if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach(error => {
          let fieldName = error.field?.startsWith('productRequest.') 
            ? error.field.replace('productRequest.', '') 
            : error.field;
          
          const simplifiedMessage = error.defaultMessage
            ?.replace('must not be empty', 'is required')
            ?.replace('must be in the future', 'must be a future date')
            ?.replace('must be greater than 0', 'must be positive')
            || error.message;
          
          backendErrors[fieldName] = simplifiedMessage;
        });
        setFormErrors(backendErrors);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create product. Please check your inputs and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (name, label, type = 'text', required = false) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          className={`w-full border ${formErrors[name] ? 'border-red-500' : 'border-gray-300'} px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isLoading}
          rows={3}
        />
      ) : (
        <div className="relative">
          <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            className={`w-full border ${formErrors[name] ? 'border-red-500' : 'border-gray-300'} px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isLoading}
            min={type === 'number' ? '0' : undefined}
            step={type === 'number' && name.includes('Price') ? '0.01' : '1'}
          />
          {isValidating && (name === 'barcode' || name === 'sku') && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      )}
      {formErrors[name] && (
        <p className="mt-1 text-sm text-red-600">
          {formErrors[name]}
        </p>
      )}
    </div>
  );

  const renderDropdown = (name, label, options, required = false) => {
    const getOptionLabel = (opt) => {
      if (label === 'Supplier') return opt.companyName || `Supplier ${opt.id}`;
      return opt.name || opt.companyName || `Option ${opt.id}`;
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          className={`w-full border ${formErrors[name] ? 'border-red-500' : 'border-gray-300'} px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isLoading || options.length === 0}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {getOptionLabel(opt)}
              {opt.abbreviation ? ` (${opt.abbreviation})` : ''}
            </option>
          ))}
        </select>
        {formErrors[name] && <p className="mt-1 text-sm text-red-600">{formErrors[name]}</p>}
        {options.length === 0 && !isLoading && (
          <p className="mt-1 text-sm text-red-600">
            No {label.toLowerCase()} found. <Link to={`/${label.toLowerCase()}s/create`} className="text-blue-600 underline">Create one</Link>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Product</h1>
        <Link to="/products" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
          Back to Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {renderInput('name', 'Product Name', 'text', true)}
            {renderInput('sku', 'SKU', 'text', true)}
            {renderInput('barcode', 'Barcode')}
            {renderInput('description', 'Description', 'textarea')}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (Max 2MB)</label>
              <div className="flex items-center space-x-4">
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-xs text-gray-500 mt-2">Upload Image</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                  />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, imageFile: null }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            {renderInput('price', 'Selling Price', 'number', true)}
            {renderInput('costPrice', 'Cost Price', 'number')}
            {renderInput('quantityInStock', 'Initial Stock', 'number')}
            {renderInput('lowStockThreshold', 'Low Stock Threshold', 'number')}
            {renderInput('expiryDate', 'Expiry Date', 'date')}
            
            {renderDropdown('categoryId', 'Category', categories, true)}
            {renderDropdown('brandId', 'Brand', brands)}
            {renderDropdown('unitId', 'Unit', units, true)}
            {renderDropdown('supplierId', 'Supplier', suppliers, true)}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-md text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} flex items-center`}
            disabled={isLoading || isValidating}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}