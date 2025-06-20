import axios from 'axios';

const API_BASE_URL =`${process.env.REACT_APP_API_BASE_URL}/financial`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetches profit and loss report data
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Promise<Object>} Profit and loss data
 */
export const getProfitLossReport = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

    const response = await api.get('/profit-loss', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    throw error;
  }
};

/**
 * Fetches supplier purchase report data
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Promise<Array>} Array of supplier purchase data
 */
export const getSupplierPurchaseReport = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

    const response = await api.get('/suppliers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier purchase report:', error);
    throw error;
  }
};

/**
 * Fetches sales report data
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Promise<Array>} Array of sales report data
 */
export const getSalesReport = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

    const response = await api.get('/sales', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales report:', error);
    throw error;
  }
};

/**
 * Fetches product performance report data
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Promise<Array>} Array of product performance data
 */
export const getProductPerformanceReport = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

    const response = await api.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching product performance report:', error);
    throw error;
  }
};

/**
 * Fetches inventory valuation report data
 * @returns {Promise<Array>} Array of inventory valuation data
 */
export const getInventoryValuationReport = async () => {
  try {
    const response = await api.get('/inventory');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory valuation report:', error);
    throw error;
  }
};

/**
 * Fetches tax report data
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Promise<Object>} Tax report data
 */
export const getTaxReport = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

    const response = await api.get('/tax', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching tax report:', error);
    throw error;
  }
};

/**
 * Exports a report in the specified format
 * @param {Object} exportRequest - Export request parameters
 * @param {string} exportRequest.reportType - Type of report to export
 * @param {Date} exportRequest.startDate - Start date for the report
 * @param {Date} exportRequest.endDate - End date for the report
 * @param {string} exportRequest.format - Export format (CSV, PDF, EXCEL)
 * @returns {Promise<Blob>} The exported file as a Blob
 */
export const exportReport = async (exportRequest) => {
  try {
    const response = await api.post('/export', exportRequest, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

/**
 * Fetches daily summary report
 * @param {Date} date - Date for the daily summary
 * @returns {Promise<Object>} Daily summary data
 */
export const getDailySummary = async (date = new Date()) => {
  try {
    const response = await api.get('/daily-summary', {
      params: { date: date.toISOString().split('T')[0] },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    throw error;
  }
};

export default {
  getProfitLossReport,
  getSupplierPurchaseReport,
  getSalesReport,
  getProductPerformanceReport,
  getInventoryValuationReport,
  getTaxReport,
  exportReport,
  getDailySummary,
};