import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateCartItem } from '../../features/cartSlice';
import { getAllProducts, getCategories } from '../../services/productServices';

const getImageUrl = (imageData) => {
  if (!imageData) return '/images/placeholder.png';
  
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
  
  return '';
};

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          getAllProducts(),
          getCategories(),
        ]);
        
        const processedProducts = prodData.map(product => ({
          ...product,
          imageUrl: getImageUrl(product.image_data)
        }));
        
        setProducts(processedProducts);
        setCategories(catData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load products. Please try again.');
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (product) => {
    const productStock = product.quantity_in_stock || 0;
    const existingItem = cartItems.find(item => item.id === product.id);

    if (productStock < 1) {
      alert(`Product ${product.name} is out of stock.`);
      return;
    }

    if (existingItem) {
      if (existingItem.quantity + 1 > productStock) {
        alert(`Not enough stock for ${product.name}`);
        return;
      }
      dispatch(updateCartItem({
        id: product.id,
        quantity: existingItem.quantity + 1
      }));
    } else {
      dispatch(addToCart({
        id: product.id,
        quantity: 1
      }));
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>
      
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              !selectedCategory ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const cartItem = cartItems.find(item => item.id === product.id);
            const inCartQuantity = cartItem ? cartItem.quantity : 0;
            
            return (
              <div
                key={product.id}
                className="bg-white p-3 rounded-lg shadow hover:shadow-md transition cursor-pointer flex flex-col"
              >
                <div className="relative pb-[100%] mb-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute h-full w-full object-cover rounded"
                    onError={(e) => {
                      e.target.src = '/images/placeholder.png';
                    }}
                  />
                </div>
                <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                <p className="text-green-600 font-semibold text-sm mt-1">
                  Ksh {(Number(product.price) || 0).toFixed(2)}
                </p>
                <p className={`text-xs mt-1 ${
                  product.quantity_in_stock > 0 ? 'text-gray-500' : 'text-red-500'
                }`}>
                  {product.quantity_in_stock > 0 ? `In Stock: ${product.quantity_in_stock}` : 'Out of Stock'}
                </p>
                {inCartQuantity > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    In Cart: {inCartQuantity}
                  </p>
                )}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.quantity_in_stock < 1}
                  className={`mt-2 text-sm px-2 py-1 rounded ${
                    product.quantity_in_stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.quantity_in_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">
              {selectedCategory
                ? 'No products found in this category'
                : 'No products available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}