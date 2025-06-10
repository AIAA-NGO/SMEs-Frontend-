// src/services/orderService.js

// Use localStorage or a global array to store orders
const ORDERS_KEY = 'mock_orders';

export function getOrders() {
  const orders = localStorage.getItem(ORDERS_KEY);
  return orders ? JSON.parse(orders) : [];
}

export function createOrder(order) {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return order; // you could add an ID here if you want
}
