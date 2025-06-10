import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Pencil, Trash2, Download, Printer } from 'lucide-react';
import { 
  getAllProducts, 
  deleteProduct,
  getCategories,
  getBrands,
  getUnits,
  getSuppliers
} from '../../services/productServices';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES'
  }).format(amount || 0);
};

// Enhanced image handler
const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  if (typeof imageData === 'string') {
    if (imageData.startsWith('data:')) return imageData;
    return `data:image/jpeg;base64,${imageData}`;
  }
  
  if (imageData instanceof Blob) {
    return URL.createObjectURL(imageData);
  }
  
  if (imageData instanceof ArrayBuffer) {
    const base64String = btoa(
      new Uint8Array(imageData).reduce(
        (data, byte) => data + String.fromCharCode(byte), ''
      )
    );
    return `data:image/jpeg;base64,${base64String}`;
  }
  
  return null;
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

          const processedProducts = await Promise.all(
            productsData.map(async (product) => {
              const imageUrl = getImageUrl(product.image_data);
              
              return {
                ...product,
                name: product.name || 'Unnamed Product',
                sku: product.sku || 'N/A',
                barcode: product.barcode || 'N/A',
                price: product.price || 0,
                costPrice: product.cost_price || 0,
                quantityInStock: product.quantity_in_stock || 0,
                lowStockThreshold: product.low_stock_threshold || 0,
                description: product.description || '',
                imageUrl: imageUrl || 'https://via.placeholder.com/100?text=No+Image',
                categoryName: categoriesData.find(c => c.id === product.category_id)?.name || 'N/A',
                brandName: brandsData.find(b => b.id === product.brand_id)?.name || 'N/A',
                unitName: unitsData.find(u => u.id === product.unit_id)?.name || 'N/A',
                supplierName: suppliersData.find(s => s.id === product.supplier_id)?.name || 'N/A'
              };
            })
          );

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

  const handleEdit = (productId) => {
    navigate(`/products/edit/${productId}`);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Product Inventory</h1>
          <button
            onClick={() => navigate('/products/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
          >
            + Add New Product
          </button>
        </div>

        {success && (
          <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="border px-4 py-2 rounded flex-grow max-w-md"
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
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
              title="Export Products"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
              title="Print Products"
            >
              <Printer size={16} />
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
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.categoryName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.brandName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            product.quantityInStock <= product.lowStockThreshold 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.quantityInStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setViewMode('view');
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(product.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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

      {viewMode === 'view' && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
                <button
                  onClick={() => setViewMode(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 flex justify-center">
                  <div className="h-64 w-64 bg-gray-100 rounded-lg border flex items-center justify-center overflow-hidden">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedProduct.name}</p>
                    <p><span className="font-medium">SKU:</span> {selectedProduct.sku}</p>
                    <p><span className="font-medium">Barcode:</span> {selectedProduct.barcode}</p>
                    <p><span className="font-medium">Description:</span> {selectedProduct.description || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pricing & Inventory</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Price:</span> {formatCurrency(selectedProduct.price)}</p>
                    <p><span className="font-medium">Cost Price:</span> {formatCurrency(selectedProduct.costPrice)}</p>
                    <p><span className="font-medium">In Stock:</span> {selectedProduct.quantityInStock}</p>
                    <p><span className="font-medium">Low Stock Threshold:</span> {selectedProduct.lowStockThreshold}</p>
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
                  onClick={() => handleEdit(selectedProduct.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => setViewMode(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;