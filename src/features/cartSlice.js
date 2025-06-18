import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0
  },
  reducers: {
    addToCart: (state, action) => {
      const { id, name, price, quantity, imageUrl, stock, sku } = action.payload;
      const existingItem = state.items.find(item => item.id === id);
      
      // Convert to numbers and provide defaults
      const numericPrice = Number(price) || 0;
      const numericQuantity = Number(quantity) || 1;
      const numericStock = Number(stock) || 0;
      
      if (existingItem) {
        // Update existing item
        existingItem.quantity += numericQuantity;
        existingItem.price = numericPrice; // Update price in case it changed
      } else {
        // Add new item with all necessary details
        state.items.push({ 
          id,
          name: name || 'Product',
          price: numericPrice,
          quantity: numericQuantity,
         
        });
      }
      
      // Recalculate totals
      state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxableAmount = state.subtotal - state.discountAmount;
      state.taxAmount = taxableAmount * 0.16;
      state.total = taxableAmount + state.taxAmount;
    },
    updateCartItem: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.quantity = Number(quantity) || 1;
        
        // Recalculate totals
        state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxableAmount = state.subtotal - state.discountAmount;
        state.taxAmount = taxableAmount * 0.16;
        state.total = taxableAmount + state.taxAmount;
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      
      // Recalculate totals
      state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxableAmount = state.subtotal - state.discountAmount;
      state.taxAmount = taxableAmount * 0.16;
      state.total = taxableAmount + state.taxAmount;
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.discountAmount = 0;
      state.taxAmount = 0;
      state.total = 0;
    },
    setCart: (state, action) => {
      // Safely parse incoming cart data
      state.items = (action.payload.items || []).map(item => ({
      
        name: item.name ,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        
      
      }));
      
      state.subtotal = Number(action.payload.subtotal) || 0;
      state.discountAmount = Number(action.payload.discountAmount) || 0;
      state.taxAmount = Number(action.payload.taxAmount) || 0;
      state.total = Number(action.payload.total) || 0;
    },
    applyDiscount: (state, action) => {
      state.discountAmount = Number(action.payload) || 0;
      // Recalculate totals
      const taxableAmount = state.subtotal - state.discountAmount;
      state.taxAmount = taxableAmount * 0.16;
      state.total = taxableAmount + state.taxAmount;
    }
  }
});

// Enhanced thunk action for fetching cart
export const fetchCart = () => async (dispatch) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://inventorymanagementsystem-latest-37zl.onrender.com/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    const cartData = await response.json();
    
    // Process the cart data before setting it
    const processedCart = {
      items: (cartData.items || []).map(item => ({
        id: item.id,
        name: item.name || 'Product',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        imageUrl: item.imageUrl || null,
        stock: Number(item.stock) || 0,
        sku: item.sku || ''
      })),
      subtotal: Number(cartData.subtotal) || 0,
      discountAmount: Number(cartData.discountAmount) || 0,
      taxAmount: Number(cartData.taxAmount) || 0,
      total: Number(cartData.total) || 0
    };
    
    dispatch(setCart(processedCart));
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    // Optionally dispatch an error action here
  }
};

export const { 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  setCart,
  applyDiscount
} = cartSlice.actions;

export default cartSlice.reducer;