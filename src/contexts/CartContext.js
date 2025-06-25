// src/contexts/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const getCartFromSession = () => {
    const cartData = sessionStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0
    };
  };

  const saveCartToSession = (cart) => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  };

  const calculateCartTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * 0.16; // Assuming 16% tax rate
    const total = taxableAmount + tax;
    
    return { 
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  const [cart, setCart] = useState(getCartFromSession());

  const updateCart = (newCart) => {
    const cartWithTotals = {
      ...newCart,
      ...calculateCartTotals(newCart.items)
    };
    setCart(cartWithTotals);
    saveCartToSession(cartWithTotals);
  };

  const addToCart = (product, quantity = 1, discount = 0) => {
    const productStock = product.quantity_in_stock || 0;
    const existingItem = cart.items.find(item => item.id === product.id);

    if (productStock < 1) return;

    let updatedItems;
    if (existingItem) {
      if (existingItem.quantity + quantity > productStock) {
        return;
      }
      updatedItems = cart.items.map(item => 
        item.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              discount: discount || item.discount
            }
          : item
      );
    } else {
      updatedItems = [
        ...cart.items,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          discount: discount || 0,
          imageUrl: product.hasImage ? `/api/products/${product.id}/image` : null,
          stock: product.quantity_in_stock,
          sku: product.sku || '',
          barcode: product.barcode || ''
        }
      ];
    }

    updateCart({
      items: updatedItems
    });
  };

  const removeFromCart = (id) => {
    const updatedItems = cart.items.filter(item => item.id !== id);
    updateCart({
      items: updatedItems
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    const updatedItems = cart.items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    updateCart({
      items: updatedItems
    });
  };

  const updateDiscount = (id, discount) => {
    const updatedItems = cart.items.map(item => {
      if (item.id === id) {
        return { ...item, discount: parseFloat(discount) };
      }
      return item;
    });
    
    updateCart({
      items: updatedItems
    });
  };

  const clearCart = () => {
    updateCart({
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0
    });
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      updateDiscount,
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};