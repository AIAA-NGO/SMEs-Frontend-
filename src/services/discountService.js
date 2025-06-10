// services/discountService.js

const API_BASE_URL = 'http://localhost:8080/api/discounts';

/**
 * Apply discount to purchase
 * @param {Object} discountData - Discount data
 * @returns {Promise<Object>} - Response from server
 */
export const applyDiscount = async (discountData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discountData)
  });
  if (!response.ok) throw new Error('Failed to apply discount');
  return await response.json();
};