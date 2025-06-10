import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  removeFromCart, 
  updateCartItem,
  clearCart 
} from '../../features/cartSlice';
import { printReceipt } from '../../components/utils/printUtils';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkoutError, setCheckoutError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerError, setCustomerError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setCustomerError(null);
        
        const [productsResponse, customersResponse] = await Promise.all([
          fetch('http://localhost:8080/api/products', {
            headers: getAuthHeader()
          }),
          fetch('http://localhost:8080/api/customers', {
            headers: getAuthHeader()
          })
        ]);

        if (!productsResponse.ok || !customersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const productsData = await productsResponse.json();
        const customersData = await customersResponse.json();

        setProducts(Array.isArray(productsData) ? productsData : []);
        setCustomers(Array.isArray(customersData?.data) ? customersData.data : 
                 Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setCustomerError('Failed to load data. Please try again.');
        setProducts([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getCartWithDetails = () => {
    return cartItems.map(cartItem => {
      const product = Array.isArray(products) ? products.find(p => p.id === cartItem.id) : null;
      return {
        ...cartItem,
        product: product || null,
        name: product?.name || 'Unknown Product',
        price: product?.price || 0,
        image: product?.image_data 
          ? `data:image/jpeg;base64,${product.image_data}` 
          : '/images/placeholder.png'
      };
    });
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(id);
      return;
    }
    dispatch(updateCartItem({ id, quantity: newQuantity }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setIsCheckingOut(true);
      setCheckoutError(null);
      
      const checkoutData = {
        customerId: selectedCustomer,
        paymentMethod: paymentMethod,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: (Array.isArray(products) ? products.find(p => p.id === item.id)?.price : 0) || 0
        }))
      };

      const response = await fetch('http://localhost:8080/api/sales', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Checkout failed');
      }

      const sale = await response.json();
      await printReceipt(sale);
      dispatch(clearCart());
      alert('Sale completed successfully!');
    } catch (err) {
      console.error("Checkout failed:", err);
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartWithDetails = getCartWithDetails();
  const subtotal = cartWithDetails.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );
  const taxAmount = subtotal * 0.16;
  const total = subtotal + taxAmount;

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Customer Information</h2>
        {customerError && (
          <div className="text-red-500 text-sm mb-4">{customerError}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer
            </label>
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Link
              to="/customers"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md text-center transition duration-150 ease-in-out"
            >
              + Add New Customer
            </Link>
          </div>
        </div>
      </div>

      {cartWithDetails.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
          <Link 
            to="/pos" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cartWithDetails.map((item) => (
                  <div key={item.id} className="p-4 flex">
                    <div className="flex-shrink-0 h-24 w-24">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/images/placeholder.png';
                        }}
                      />
                    </div>
                    
                    <div className="ml-4 flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium">
                          <Link to={`/products/${item.id}`} className="hover:text-blue-600">
                            {item.name}
                          </Link>
                        </h3>
                        <p className="ml-4 font-bold">
                          Ksh {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex-1 flex items-end justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="px-3 py-1 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 border-t border-b text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="px-3 py-1 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>Ksh {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (16%):</span>
                  <span>Ksh {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>Total:</span>
                  <span>Ksh {total.toFixed(2)}</span>
                </div>
              </div>
              
              {checkoutError && (
                <div className="text-red-500 text-sm mb-4">{checkoutError}</div>
              )}
              
              <button
                onClick={() => dispatch(clearCart())}
                className="w-full mb-4 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
              >
                Clear Cart
              </button>
              
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full py-3 px-4 rounded-md font-medium transition duration-150 ease-in-out ${
                  isCheckingOut
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isCheckingOut ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;