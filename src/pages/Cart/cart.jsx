import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  removeFromCart, 
  updateCartItem,
  clearCart,
  applyDiscount
} from '../../features/cartSlice';
import { printReceipt } from '../../components/utils/printUtils';
import { FaMoneyBillWave, FaCreditCard, FaMobileAlt, FaUniversity } from 'react-icons/fa';

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
  const { subtotal, discountAmount, taxAmount, total } = useSelector(state => state.cart);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerError, setCustomerError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mpesaStatus, setMpesaStatus] = useState(null);
  const [mpesaLoading, setMpesaLoading] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setCustomerError(null);
        
        const customersResponse = await fetch('http://localhost:8080/api/customers', {
          headers: getAuthHeader()
        });

        if (!customersResponse.ok) {
          throw new Error('Failed to fetch customers');
        }

        const customersData = await customersResponse.json();
        setCustomers(Array.isArray(customersData?.data) ? customersData.data : 
                   Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        setCustomerError('Failed to load customers. Please try again.');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(id);
      return;
    }
    
    const item = cartItems.find(item => item.id === id);
    if (!item) return;
    
    dispatch(updateCartItem({ 
      id,
      quantity: newQuantity,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      stock: item.stock,
      sku: item.sku,
      discount: item.discount
    }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const initiateMpesaPayment = async () => {
    try {
      setMpesaLoading(true);
      setMpesaStatus('Initiating M-Pesa payment...');
      
      // Validate phone number format (add your country's validation)
      const formattedPhone = formatPhoneNumber(mpesaNumber);
      if (!formattedPhone) {
        throw new Error('Invalid phone number format');
      }

      const mpesaRequest = {
        amount: Math.round(total), // M-Pesa requires whole numbers
        phoneNumber: formattedPhone,
        accountReference: `POS-${Date.now()}`,
        transactionDesc: `Purchase for customer ${selectedCustomer}`
      };

      const response = await fetch('http://localhost:8080/api/mpesa/stkpush/initiate', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(mpesaRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'M-Pesa payment initiation failed');
      }

      const mpesaResponse = await response.json();
      setMpesaStatus('Payment initiated. Please check your phone to complete payment...');
      
      // Poll for payment status (simplified version)
      return await checkPaymentStatus(mpesaResponse.CheckoutRequestID);
      
    } catch (error) {
      console.error("M-Pesa payment error:", error);
      setMpesaStatus(`Payment failed: ${error.message}`);
      setMpesaLoading(false);
      throw error;
    }
  };

  const checkPaymentStatus = async (checkoutRequestId) => {
    // In a real app, you might implement WebSockets or more sophisticated polling
    // This is a simplified version that checks a few times
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(`http://localhost:8080/api/mpesa/status/${checkoutRequestId}`, {
          headers: getAuthHeader()
        });

        if (response.ok) {
          const statusData = await response.json();
          if (statusData.status === 'COMPLETED') {
            setMpesaStatus('Payment completed successfully!');
            setMpesaLoading(false);
            return true;
          } else if (statusData.status === 'FAILED') {
            setMpesaStatus('Payment failed. Please try again.');
            setMpesaLoading(false);
            return false;
          }
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }
    
    setMpesaStatus('Payment verification timed out. Please confirm payment.');
    setMpesaLoading(false);
    return false;
  };

  const formatPhoneNumber = (phone) => {
    // Format phone number to 2547XXXXXXXX
    if (!phone) return null;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Convert to Safaricom format (254...)
    if (digits.startsWith('0')) {
      return `254${digits.substring(1)}`;
    } else if (digits.startsWith('7') && digits.length === 9) {
      return `254${digits}`;
    } else if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }
    
    return null;
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

    if (paymentMethod === 'MPESA' && !mpesaNumber) {
      alert('Please enter M-Pesa phone number');
      return;
    }

    try {
      setIsCheckingOut(true);
      setCheckoutError(null);
      
      // For M-Pesa payments, first process payment
      if (paymentMethod === 'MPESA') {
        const paymentSuccess = await initiateMpesaPayment();
        if (!paymentSuccess) {
          throw new Error('M-Pesa payment failed');
        }
      }

      // Proceed with sale creation after successful payment (or for non-M-Pesa)
      const checkoutData = {
        customerId: selectedCustomer,
        paymentMethod: paymentMethod,
        mpesaNumber: paymentMethod === 'MPESA' ? mpesaNumber : undefined,
        mpesaTransactionId: paymentMethod === 'MPESA' ? mpesaStatus.includes('completed') ? 'MPESA-' + Date.now() : undefined : undefined,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          sku: item.sku,
          discount: item.discount || 0
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
      setMpesaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
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
        <>
          {/* Customer Information Section */}
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

          {/* Cart Items and Order Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 flex">
                      {item.imageUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="h-20 w-20 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="ml-4 flex-1 flex flex-col">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium">
                            {item.name || 'Product'}
                          </h3>
                          <p className="ml-4 font-bold">
                            Ksh {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <p className="text-gray-600">
                            Unit Price: Ksh {item.price ? item.price.toFixed(2) : '0.00'}
                          </p>
                          {item.discount > 0 && (
                            <span className="ml-2 text-green-600">
                              (Discount: Ksh {item.discount.toFixed(2)})
                            </span>
                          )}
                        </div>
                        {item.sku && (
                          <p className="text-gray-500 text-xs">SKU: {item.sku}</p>
                        )}
                        
                        <div className="flex-1 flex items-end justify-between mt-2">
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
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                {/* Payment Method Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex items-center justify-center p-3 rounded-md border ${paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <FaMoneyBillWave className="mr-2" />
                      <span>Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('CARD')}
                      className={`flex items-center justify-center p-3 rounded-md border ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <FaCreditCard className="mr-2" />
                      <span>Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('MPESA')}
                      className={`flex items-center justify-center p-3 rounded-md border ${paymentMethod === 'MPESA' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <FaMobileAlt className="mr-2" />
                      <span>M-Pesa</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`flex items-center justify-center p-3 rounded-md border ${paymentMethod === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <FaUniversity className="mr-2" />
                      <span>Bank</span>
                    </button>
                  </div>
                  {paymentMethod === 'MPESA' && (
                    <div className="mt-2">
                      <input
                        type="tel"
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                        placeholder="Enter M-Pesa phone number (e.g., 07XXXXXXXX)"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {mpesaStatus && (
                        <div className={`mt-2 text-sm p-2 rounded ${
                          mpesaStatus.includes('failed') ? 'bg-red-100 text-red-700' : 
                          mpesaStatus.includes('completed') ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {mpesaStatus}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Totals */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>Ksh {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>Ksh {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
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
                  disabled={isCheckingOut || mpesaLoading}
                  className={`w-full py-3 px-4 rounded-md font-medium transition duration-150 ease-in-out ${
                    isCheckingOut || mpesaLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {mpesaLoading ? 'Processing M-Pesa...' : 
                   isCheckingOut ? 'Completing Sale...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;