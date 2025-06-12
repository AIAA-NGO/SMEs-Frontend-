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
  try {
    const response = await fetch(API_BASE_URL, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch purchases');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

/**
 * Create new purchase
 * @param {Object} purchaseData - Purchase data
 * @returns {Promise<Object>} - Created purchase
 */
export const createPurchase = async (purchaseData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(purchaseData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create purchase');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

/**
 * Get purchase by ID
 * @param {number|string} id - Purchase ID
 * @returns {Promise<Object>} - Purchase details
 */
export const getPurchaseById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch purchase');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching purchase ${id}:`, error);
    throw error;
  }
};

/**
 * Mark purchase as received
 * @param {number|string} id - Purchase ID
 * @returns {Promise<Object>} - Updated purchase
 */
export const receivePurchase = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/receive`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark purchase as received');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error receiving purchase ${id}:`, error);
    throw error;
  }
};

/**
 * Delete purchase
 * @param {number|string} id - Purchase ID
 * @returns {Promise<void>}
 */
export const deletePurchase = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete purchase');
    }
  } catch (error) {
    console.error(`Error deleting purchase ${id}:`, error);
    throw error;
  }
};

/**
 * Update purchase
 * @param {number|string} id - Purchase ID
 * @param {Object} purchaseData - Updated purchase data
 * @returns {Promise<Object>} - Updated purchase
 */
export const updatePurchase = async (id, purchaseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(purchaseData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update purchase');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating purchase ${id}:`, error);
    throw error;
  }
};

/**
 * Apply discount to purchase
 * @param {number|string} id - Purchase ID
 * @param {Object} discountData - Discount data
 * @returns {Promise<Object>} - Updated purchase
 */
export const applyDiscount = async (id, discountData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/discount`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(discountData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to apply discount');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error applying discount to purchase ${id}:`, error);
    throw error;
  }
};