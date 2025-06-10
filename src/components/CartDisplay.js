// src/components/CartDisplay.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getCart as fetchCart,
  removeFromCart as removeFromCartAPI,
  updateCartItem as updateCartItemAPI
} from '../services/cartService';
import { setCart, removeFromCart, updateCartItem } from '../features/cartSlice';

const CartDisplay = () => {
  const dispatch = useDispatch();
  const { items, subtotal, discountAmount, taxAmount, total } = useSelector(state => state.cart);
  
  // Fetch cart data on component mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await fetchCart();
        dispatch(setCart(cartData));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    };
    loadCart();
  }, [dispatch]);

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCartAPI(productId);
      dispatch(removeFromCart(productId));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItemAPI(productId, newQuantity);
      dispatch(updateCartItem({ id: productId, quantity: newQuantity }));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <h3>Your cart is empty</h3>
        <p>Start shopping to add items to your cart</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Your Shopping Cart</h2>
      
      <div className="cart-items">
        {items.map(item => (
          <div key={item.product_id} className="cart-item">
            <div className="item-image">
              <img 
                src={item.product_image || '/placeholder-product.jpg'} 
                alt={item.product_name} 
              />
            </div>
            <div className="item-details">
              <h3>{item.product_name}</h3>
              <p>Price: Ksh {item.product_price.toFixed(2)}</p>
              
              <div className="quantity-control">
                <button 
                  onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={() => handleRemoveItem(item.product_id)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
            <div className="item-total">
              Ksh {(item.product_price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>Ksh {subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Discount:</span>
          <span>-Ksh {discountAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax (16%):</span>
          <span>Ksh {taxAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>Ksh {total.toFixed(2)}</span>
        </div>
        
        <button className="checkout-btn">Proceed to Checkout</button>
      </div>
    </div>
  );
};

export default CartDisplay;