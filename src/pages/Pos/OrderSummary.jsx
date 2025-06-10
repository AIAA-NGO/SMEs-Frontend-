import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateCartItem, clearCart } from '../../features/cartSlice';
import { cartService } from '../../services/cartService';
import { getAllCustomers } from '../../services/customerService';
import { printReceipt } from '../../utils/printUtils';

export default function OrderSummary({ onCheckoutSuccess }) {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getAllCustomers();
        setCustomers(data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setLoading(true);
      dispatch(updateCartItem({ id: productId, quantity: newQuantity }));
      await cartService.updateCartItemQuantity(productId, newQuantity);
    } catch (err) {
      console.error("Failed to update quantity:", err);
      alert(`Failed to update quantity: ${err.response?.data?.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      setLoading(true);
      dispatch(removeFromCart(productId));
      await cartService.removeItemFromCart(productId);
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert(`Failed to remove item: ${err.response?.data?.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (cart.items.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const checkoutData = {
        customerId: selectedCustomer,
        paymentMethod: paymentMethod
      };

      const sale = await cartService.checkout(checkoutData);
      await printReceipt(sale);
      dispatch(clearCart());
      
      if (onCheckoutSuccess) onCheckoutSuccess(sale);
      alert('Sale completed successfully!');
    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select
          value={selectedCustomer || ''}
          onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
          className="w-full p-2 border rounded"
          disabled={loading}
        >
          <option value="">Select Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.phone})
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
        >
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="MPESA">M-Pesa</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>
      </div>
      
      <div className="border-t border-b py-4 mb-4 flex-grow overflow-y-auto">
        {cart.items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Your cart is empty</p>
        ) : (
          <ul className="divide-y">
            {cart.items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-gray-600 text-sm">Ksh {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={loading || item.quantity <= 1}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={loading}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={loading}
                      className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span>Subtotal:</span>
                  <span>Ksh {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Ksh {cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>- Ksh {cart.discountAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (16%):</span>
          <span>Ksh {cart.taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total:</span>
          <span>Ksh {cart.total.toFixed(2)}</span>
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}
      
      <button
        onClick={handleCheckout}
        disabled={loading || cart.items.length === 0}
        className={`w-full py-2 px-4 rounded font-medium ${
          loading || cart.items.length === 0
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {loading ? 'Processing...' : 'Complete Sale'}
      </button>
    </div>
  );
}