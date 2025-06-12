import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateCartItem } from '../../features/cartSlice';
import { getAllProducts, getCategories, getProductImage } from '../../services/productServices';
import { FiShoppingCart, FiRefreshCw, FiAlertCircle, FiSearch, FiPlus, FiMinus } from 'react-icons/fi';
import { BsCartPlus, BsStarFill, BsStarHalf, BsStar } from 'react-icons/bs';

const ProductCard = ({ product, onAddToCart, cartQuantity }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      try {
        setImageLoading(true);
        setImageError(false);
        
        const imageBlob = await getProductImage(product.id);
        
        if (isMounted) {
          const url = URL.createObjectURL(imageBlob);
          setImageUrl(url);
        }
      } catch (error) {
        if (isMounted) {
          setImageError(true);
        }
      } finally {
        if (isMounted) {
          setImageLoading(false);
        }
      }
    };

    if (product.hasImage) {
      fetchImage();
    } else {
      setImageError(true);
      setImageLoading(false);
    }

    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [product.id, product.hasImage]);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > product.quantity_in_stock) return;
    setQuantity(newQuantity);
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<BsStarFill key={i} className="text-yellow-400 text-xs" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<BsStarHalf key={i} className="text-yellow-400 text-xs" />);
      } else {
        stars.push(<BsStar key={i} className="text-yellow-400 text-xs" />);
      }
    }
    
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100">
      {/* Product Image */}
      <div className="relative pb-[100%] bg-gradient-to-br from-gray-50 to-gray-100">
        {imageLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse rounded-full h-12 w-12 bg-gray-200"></div>
          </div>
        ) : imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <FiShoppingCart className="text-3xl mb-1" />
            <span className="text-xs">No Image</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="absolute h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: imageLoading ? 0 : 1 }}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              if (imageUrl) URL.revokeObjectURL(imageUrl);
            }}
          />
        )}
        
        {/* Stock Badge */}
        {product.quantity_in_stock <= 0 ? (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Sold Out
          </div>
        ) : product.quantity_in_stock < 10 ? (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Low Stock
          </div>
        ) : null}
        
        {/* Quick Add Button */}
        {product.quantity_in_stock > 0 && (
          <button
            onClick={() => onAddToCart(product, quantity)}
            className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
            aria-label="Add to cart"
          >
            <BsCartPlus className="text-lg" />
          </button>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4 flex-grow flex flex-col">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-gray-500 text-xs mt-1">{product.brand}</p>
          )}
        </div>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center mb-2">
            <div className="flex mr-1">
              {renderRatingStars(product.rating)}
            </div>
            <span className="text-gray-500 text-xs">({product.reviewCount || 0})</span>
          </div>
        )}
        
        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-600 font-bold text-base">
              Ksh {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            {product.costPrice && (
              <p className="text-gray-400 text-xs line-through">
                Ksh {Number(product.costPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          {/* Stock & Cart Info */}
          <div className="flex justify-between items-center text-xs mb-3">
            <span className={`px-2 py-1 rounded-full ${
              product.quantity_in_stock > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.quantity_in_stock > 0 ? 
                `${product.quantity_in_stock} in stock` : 
                'Out of stock'}
            </span>
            
            {cartQuantity > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {cartQuantity} in cart
              </span>
            )}
          </div>
          
          {/* Quantity Selector */}
          {product.quantity_in_stock > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                >
                  <FiMinus className="text-sm" />
                </button>
                <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.quantity_in_stock}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                >
                  <FiPlus className="text-sm" />
                </button>
              </div>
              
              <button
                onClick={() => onAddToCart(product, quantity)}
                className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BsCartPlus className="mr-1" />
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
        <button
          onClick={() => onSelectCategory(null)}
          className={`text-xs px-3 py-1 rounded-full ${
            !selectedCategory 
              ? 'bg-blue-600 text-white' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          View All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="py-16">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow overflow-hidden animate-pulse">
          <div className="pb-[100%] bg-gray-200"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="bg-red-100 p-4 rounded-full mb-4">
      <FiAlertCircle className="text-red-500 text-3xl" />
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to load products</h3>
    <p className="text-gray-600 mb-6 max-w-md">{error}</p>
    <button
      onClick={onRetry}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
    >
      <FiRefreshCw />
      <span>Try Again</span>
    </button>
  </div>
);

const EmptyState = ({ selectedCategory }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="bg-blue-100 p-4 rounded-full mb-4">
      <FiShoppingCart className="text-blue-500 text-3xl" />
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">
      {selectedCategory ? 'No products in this category' : 'No products available'}
    </h3>
    <p className="text-gray-600 max-w-md">
      {selectedCategory
        ? 'Try selecting a different category or check back later'
        : 'Our inventory is currently empty. Please check back soon.'}
    </p>
  </div>
);

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodData, catData] = await Promise.all([
        getAllProducts(),
        getCategories(),
      ]);
      
      const processedProducts = prodData.map(product => ({
        ...product,
        hasImage: product.imageData !== null,
        // Ensure price is properly formatted
        price: Number(product.price),
        costPrice: product.costPrice ? Number(product.costPrice) : null
      }));
      
      setProducts(processedProducts);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load products. Please try again.');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToCart = (product, quantity = 1) => {
    const productStock = product.quantity_in_stock || 0;
    const existingItem = cartItems.find(item => item.id === product.id);

    if (productStock < 1) return;

    if (existingItem) {
      if (existingItem.quantity + quantity > productStock) {
        return;
      }
      dispatch(updateCartItem({
        id: product.id,
        quantity: existingItem.quantity + quantity,
        // Ensure we update all necessary fields
        name: product.name,
        price: product.price
      }));
    } else {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        imageUrl: product.hasImage ? `/api/products/${product.id}/image` : null,
        stock: product.quantity_in_stock,
        sku: product.sku || '',
        barcode: product.barcode || ''
      }));
    }
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = !selectedCategory || product.category_id === selectedCategory;
    const searchMatch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Point of Sale</h1>
          <p className="text-gray-600">Browse and add products to cart</p>
        </header>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products by name, SKU or barcode..."
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchData} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState selectedCategory={selectedCategory} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const cartItem = cartItems.find(item => item.id === product.id);
              const cartQuantity = cartItem ? cartItem.quantity : 0;
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  cartQuantity={cartQuantity}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}