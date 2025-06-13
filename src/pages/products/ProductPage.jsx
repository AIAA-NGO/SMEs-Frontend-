import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Pencil, Trash2, Download, Printer, Save, X } from 'lucide-react';
import { 
  getAllProducts, 
  deleteProduct,
  getCategories,
  getBrands,
  getUnits,
  getSuppliers,
  updateProduct
} from '../../services/productServices';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES'
  }).format(amount || 0);
};

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  const [relationships, setRelationships] = useState({
    categories: [],
    brands: [],
    units: [],
    suppliers: []
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    price: 0,
    costPrice: 0,
    quantityInStock: 0,
    lowStockThreshold: 0,
    expiryDate: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    supplierId: '',
    imageFile: null
  });
  const navigate = useNavigate();   
const location = useLocation();   


  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const [productsData, categoriesData, brandsData, unitsData, suppliersData] = await Promise.all([
          getAllProducts(),
          getCategories(),
          getBrands(),
          getUnits(),
          getSuppliers()
        ]);

        if (isMounted) {
          setRelationships({
            categories: categoriesData,
            brands: brandsData,
            units: unitsData,
            suppliers: suppliersData
          });

          const processedProducts = productsData.map((product) => {
            let imageUrl = null;
            if (product.imageData) {
              const blob = new Blob([new Uint8Array(product.imageData)], { 
                type: product.imageContentType || 'image/jpeg' 
              });
              imageUrl = URL.createObjectURL(blob);
            }
            
            return {
              ...product,
              id: product.id,
              name: product.name || 'Unnamed Product',
              sku: product.sku || 'N/A',
              barcode: product.barcode || 'N/A',
              price: product.price || 0,
              costPrice: product.costPrice || product.cost_price || 0,
              quantityInStock: product.quantityInStock || product.quantity_in_stock || 0,
              lowStockThreshold: product.lowStockThreshold || product.low_stock_threshold || 0,
              expiryDate: product.expiryDate || product.expiry_date || null,
              description: product.description || '',
              imageUrl,
              categoryId: product.categoryId || product.category_id,
              brandId: product.brandId || product.brand_id,
              unitId: product.unitId || product.unit_id,
              supplierId: product.supplierId || product.supplier_id,
              categoryName: categoriesData.find(c => c.id === (product.categoryId || product.category_id))?.name || 'N/A',
              brandName: brandsData.find(b => b.id === (product.brandId || product.brand_id))?.name || 'N/A',
              unitName: unitsData.find(u => u.id === (product.unitId || product.unit_id))?.name || 'N/A',
              supplierName: suppliersData.find(s => s.id === (product.supplierId || product.supplier_id))?.name || 'N/A'
            };
          });

          setProducts(processedProducts);
          setFilteredProducts(processedProducts);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Data loading error:', err);
          setError('Failed to load product data. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
      
      if (location.state?.shouldRefresh) {
        fetchData();
      }
    }

    return () => {
      isMounted = false;
      products.forEach(product => {
        if (product.imageUrl) {
          URL.revokeObjectURL(product.imageUrl);
        }
      });
    };
  }, [navigate, location]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term.length > 0) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.sku && product.sku.toLowerCase().includes(term)) ||
        (product.barcode && product.barcode.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        setFilteredProducts(prev => prev.filter(p => p.id !== id));
        setSuccess('Product deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setViewMode('edit');
    setEditFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      quantityInStock: product.quantityInStock,
      lowStockThreshold: product.lowStockThreshold,
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      categoryId: product.categoryId,
      brandId: product.brandId,
      unitId: product.unitId,
      supplierId: product.supplierId,
      imageFile: null
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imageFile') {
      setEditFormData({
        ...editFormData,
        [name]: files[0]
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  const handleUpdateProduct = async () => {
    try {
      setIsLoading(true);
      const updatedProduct = await updateProduct(selectedProduct.id, editFormData);
      
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id ? { ...p, ...updatedProduct } : p
      ));
      setFilteredProducts(prev => prev.map(p => 
        p.id === selectedProduct.id ? { ...p, ...updatedProduct } : p
      ));
      
      setSuccess('Product updated successfully');
      setViewMode(null);
    } catch (error) {
      console.error('Update error:', error);
      setError('Failed to update product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Product Inventory</h1>
          <button
            onClick={() => navigate('/products/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-200"
          >
            + Add New Product
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products by name, SKU or barcode..."
            value={searchTerm}
            onChange={handleSearch}
            className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition flex-grow max-w-md"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(filteredProducts, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'products_export.json';
                link.click();
              }}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded-md shadow-sm transition"
              title="Export Products"
            >
              <Download size={18} className="text-gray-700" />
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded-md shadow-sm transition"
              title="Print Products"
            >
              <Printer size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-10 w-10 rounded-md overflow-hidden flex items-center justify-center bg-gray-100 border border-gray-200">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.src = '';
                                  e.target.parentElement.classList.add('bg-gray-200');
                                }}
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.barcode && (
                            <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.categoryName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.brandName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold leading-4 ${
                            product.quantityInStock <= product.lowStockThreshold 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.quantityInStock} {product.unitName && `(${product.unitName})`}
                          </span>
                          {product.lowStockThreshold > 0 && (
                            <div className="text-xs text-gray-500 mt-1">Threshold: {product.lowStockThreshold}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setViewMode('view');
                              }}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditClick(product)}
                              className="text-green-600 hover:text-green-800 transition"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No products match your search' : 'No products available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewMode === 'view' && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
                <button
                  onClick={() => setViewMode(null)}
                  className="text-gray-400 hover:text-gray-500 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 flex justify-center">
                  <div className="h-64 w-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedProduct.imageUrl ? (
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name} 
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedProduct.name}</p>
                    <p><span className="font-medium">SKU:</span> {selectedProduct.sku}</p>
                    <p><span className="font-medium">Barcode:</span> {selectedProduct.barcode || 'N/A'}</p>
                    <p><span className="font-medium">Description:</span> {selectedProduct.description || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pricing & Inventory</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Price:</span> {formatCurrency(selectedProduct.price)}</p>
                    <p><span className="font-medium">Cost Price:</span> {formatCurrency(selectedProduct.costPrice)}</p>
                    <p><span className="font-medium">In Stock:</span> {selectedProduct.quantityInStock} {selectedProduct.unitName && `(${selectedProduct.unitName})`}</p>
                    <p><span className="font-medium">Low Stock Threshold:</span> {selectedProduct.lowStockThreshold}</p>
                    {selectedProduct.expiryDate && (
                      <p><span className="font-medium">Expiry Date:</span> {new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Relationships</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Category:</span> {selectedProduct.categoryName}</p>
                    <p><span className="font-medium">Brand:</span> {selectedProduct.brandName}</p>
                    <p><span className="font-medium">Unit:</span> {selectedProduct.unitName}</p>
                    <p><span className="font-medium">Supplier:</span> {selectedProduct.supplierName}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleEditClick(selectedProduct)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => setViewMode(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {viewMode === 'edit' && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Product</h2>
                <button
                  onClick={() => setViewMode(null)}
                  className="text-gray-400 hover:text-gray-500 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProduct();
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={editFormData.sku}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={editFormData.barcode}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <input
                      type="number"
                      name="costPrice"
                      value={editFormData.costPrice}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock *</label>
                    <input
                      type="number"
                      name="quantityInStock"
                      value={editFormData.quantityInStock}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={editFormData.lowStockThreshold}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      min="0"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={editFormData.expiryDate}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="categoryId"
                      value={editFormData.categoryId}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    >
                      <option value="">Select Category</option>
                      {relationships.categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <select
                      name="brandId"
                      value={editFormData.brandId}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    >
                      <option value="">Select Brand</option>
                      {relationships.brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      name="unitId"
                      value={editFormData.unitId}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    >
                      <option value="">Select Unit</option>
                      {relationships.units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      name="supplierId"
                      value={editFormData.supplierId}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    >
                      <option value="">Select Supplier</option>
                      {relationships.suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      rows="3"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <input
                      type="file"
                      name="imageFile"
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept="image/*"
                    />
                    {selectedProduct.imageUrl && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Current Image:</p>
                        <img 
                          src={selectedProduct.imageUrl} 
                          alt="Current product" 
                          className="h-20 w-20 object-contain border rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setViewMode(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-1" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;