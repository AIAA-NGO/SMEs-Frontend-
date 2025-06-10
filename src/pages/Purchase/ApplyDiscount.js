import React, { useState, useEffect } from 'react';
import { applyDiscount } from '../../services/discountService';
import { getAllProducts } from '../../services/productService';

const ApplyDiscount = ({ purchaseId, onDiscountApplied }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    percentage: 10,
    validFrom: '',
    validTo: '',
    description: '',
    productIds: []
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleProductSelect = (productId) => {
    setFormData(prev => {
      const newProductIds = prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId];
      return { ...prev, productIds: newProductIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const discountData = {
        ...formData,
        percentage: Number(formData.percentage),
        productIds: formData.productIds.map(Number),
        validFrom: formData.validFrom || new Date().toISOString(),
        validTo: formData.validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      await applyDiscount(discountData);
      onDiscountApplied();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Apply Discount</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
            <input
              type="number"
              name="percentage"
              min="1"
              max="100"
              value={formData.percentage}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
            <input
              type="datetime-local"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
            <input
              type="datetime-local"
              name="validTo"
              value={formData.validTo}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Apply to Products</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {products.map(product => (
              <div key={product.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`product-${product.id}`}
                  checked={formData.productIds.includes(product.id)}
                  onChange={() => handleProductSelect(product.id)}
                  className="mr-2"
                />
                <label htmlFor={`product-${product.id}`} className="text-sm">
                  {product.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply Discount
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyDiscount;