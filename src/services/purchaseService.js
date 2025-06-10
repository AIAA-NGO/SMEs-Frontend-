const API_BASE_URL = 'http://localhost:8080/api/purchases';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Fetch all purchases
 * @returns {Promise<Array>} - Array of purchases
 */
export const getAllPurchases = async () => {
  const response = await fetch(API_BASE_URL, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error('Failed to fetch purchases');
  return await response.json();
};

/**
 * Create new purchase
 * @param {Object} purchaseData - Purchase data
 * @returns {Promise<Object>} - Created purchase
 */
export const createPurchase = async (purchaseData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(purchaseData)
  });
  if (!response.ok) throw new Error('Failed to create purchase');
  return await response.json();
};

/**
 * Get purchase by ID
 * @param {number} id - Purchase ID
 * @returns {Promise<Object>} - Purchase details
 */
export const getPurchaseById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error('Failed to fetch purchase');
  return await response.json();
};

/**
 * Mark purchase as received
 * @param {number} id - Purchase ID
 * @returns {Promise<Object>} - Updated purchase
 */
export const receivePurchase = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}/receive`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error('Failed to mark purchase as received');
  return await response.json();
};

/**
 * Delete purchase
 * @param {number} id - Purchase ID
 * @returns {Promise<void>}
 */
export const deletePurchase = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error('Failed to delete purchase');
};

/**
 * Update purchase
 * @param {number} id - Purchase ID
 * @param {Object} purchaseData - Updated purchase data
 * @returns {Promise<Object>} - Updated purchase
 */
export const updatePurchase = async (id, purchaseData) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(purchaseData)
  });
  if (!response.ok) throw new Error('Failed to update purchase');
  return await response.json();
};

/**
 * Apply discount to purchase
 * @param {number} id - Purchase ID
 * @param {Object} discountData - Discount data
 * @returns {Promise<Object>} - Updated purchase
 */
export const applyDiscount = async (id, discountData) => {
  const response = await fetch(`${API_BASE_URL}/${id}/discount`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(discountData)
  });
  if (!response.ok) throw new Error('Failed to apply discount');
  return await response.json();
};
