import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
// import AdminDashboardControl from './AdminDashboardControl';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { 
  FaBoxes, 
  FaExclamationTriangle, 
  FaHistory, 
  FaCalendarAlt, 
  FaTag 
} from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://inventorymanagementsystem-latest-37zl.onrender.com/api';

const AdminDashboardControl = () => {
  // State management
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState({
    dashboard: true,
    discounts: true
  });
  const [error, setError] = useState({
    dashboard: null,
    discounts: null
  });
  
  const [dashboardData, setDashboardData] = useState({
    summary: {
      subtotal: 0,
      discount: 0,
      total: 0,
      salesProfit: 0,
      totalSales: 0,
      inventoryCount: 0,
      customerCount: 0,
      expiredItemsCount: 0,
      lowStockItemsCount: 0
    },
    topProducts: [],
    lowStockItems: [],
    recentSales: [],
    profitData: {
      totalProfit: 0,
      totalRevenue: 0,
      totalCost: 0
    }
  });

  const [salesTrend, setSalesTrend] = useState({
    daily: {
      data: [],
      labels: [],
      loading: true,
      error: null
    },
    monthly: {
      data: [],
      labels: [],
      loading: true,
      error: null
    }
  });

  const [activeDiscounts, setActiveDiscounts] = useState([]);

  // Helper functions
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const formatKES = (amount) => {
    if (isNaN(amount)) return "KSH 0";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('KES', 'KSH');
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDiscountDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Data fetching functions
const fetchDashboardData = async () => {
  try {
    setLoading(prev => ({ ...prev, dashboard: true, discounts: true }));
    setError(prev => ({ ...prev, dashboard: null, discounts: null }));
    
    // Fetch dashboard summary and active discounts in parallel
    const [summaryRes, discountsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/dashboard/summary`, getAuthHeader()),
      axios.get(`${API_BASE_URL}/discounts/active`, getAuthHeader())
    ]);

    const data = summaryRes.data;
    const discounts = discountsRes.data || [];

    setDashboardData({
      summary: {
        subtotal: data.totalSalesAmount || 0,
        discount: data.totalDiscounts || 0,
        total: data.totalRevenue || 0,
        salesProfit: data.totalProfit || 0,
        totalSales: data.totalSalesCount || 0,
        inventoryCount: data.totalInventoryItems || 0,
        customerCount: data.totalCustomers || 0,
        expiredItemsCount: data.expiredItemsCount || 0,
        lowStockItemsCount: data.lowStockItemsCount || 0
      },
      topProducts: data.topProducts || [],
      lowStockItems: data.lowStockItems || [],
      recentSales: data.recentSales || [],
      profitData: {
        totalProfit: data.totalProfit || 0,
        totalRevenue: data.totalRevenue || 0,
        totalCost: data.totalCost || 0
      }
    });

    setActiveDiscounts(discounts);
    
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
    setError(prev => ({ ...prev, dashboard: err.response?.data?.message || err.message }));
  } finally {
    setLoading(prev => ({ ...prev, dashboard: false, discounts: false }));
  }
};







  
//shows evry single sale
  // const fetchDailySalesTrend = async () => {
  //   try {
  //     setSalesTrend(prev => ({
  //       ...prev,
  //       daily: { ...prev.daily, loading: true, error: null }
  //     }));
      
  //     const response = await axios.get(
  //       ${API_BASE_URL}/dashboard/sales-trend?periodType=DAILY, 
  //       getAuthHeader()
  //     );
      
  //     setSalesTrend(prev => ({
  //       ...prev,
  //       daily: {
  //         data: response.data.map(item => item.amount),
  //         labels: response.data.map(item => item.period),
  //         loading: false,
  //         error: null
  //       }
  //     }));
  //   } catch (err) {
  //     console.error("Failed to fetch daily sales trend:", err);
  //     setSalesTrend(prev => ({
  //       ...prev,
  //       daily: {
  //         ...prev.daily,
  //         loading: false,
  //         error: err.response?.data?.message || err.message
  //       }
  //     }));
  //   }
  // };

  const fetchDailySalesTrend = async () => {
  try {
    setSalesTrend(prev => ({
      ...prev,
      daily: { ...prev.daily, loading: true, error: null }
    }));

    // Get the last 30 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // 30 days total (current + 29 previous days)

    const response = await axios.get(
      `${API_BASE_URL}/sales/trend`,
      {
        ...getAuthHeader(),
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          periodType: 'DAILY'
        }
      }
    );

    // Process the data to get total sales per day
    const dailyTotals = response.data.reduce((acc, item) => {
      const date = new Date(item.period);
      const dateKey = date.toISOString().split('T')[0]; // Format as "YYYY-MM-DD"
      
      if (!acc[dateKey]) {
        acc[dateKey] = 0;
      }
      acc[dateKey] += item.amount;
      return acc;
    }, {});

    // Convert to arrays sorted by date
    const sortedDates = Object.keys(dailyTotals).sort();
    const amounts = sortedDates.map(date => dailyTotals[date]);
    
    // Format labels as "DD MMM" (e.g., "15 Jun")
    const formattedLabels = sortedDates.map(date => {
      const [year, month, day] = date.split('-');
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-KE', { 
        day: 'numeric', 
        month: 'short' 
      });
    });

    setSalesTrend(prev => ({
      ...prev,
      daily: {
        data: amounts,
        labels: formattedLabels,
        loading: false,
        error: null
      }
    }));

  } catch (err) {
    console.error("Failed to fetch daily sales trend:", err);
    setSalesTrend(prev => ({
      ...prev,
      daily: {
        ...prev.daily,
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to load daily sales data"
      }
    }));
  }
};







const fetchMonthlySalesTrend = async () => {
  try {
    setSalesTrend(prev => ({
      ...prev,
      monthly: { ...prev.monthly, loading: true, error: null }
    }));
    
    // Get the last 12 months of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 11); // 12 months total (current + 11 previous)
    startDate.setDate(1); // Start from first day of month

    const response = await axios.get(
     `${API_BASE_URL}/sales/trend`,
      {
        ...getAuthHeader(),
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          periodType: 'MONTHLY'
        }
      }
    );

    // Process the data to get total sales per month
    const monthlyTotals = response.data.reduce((acc, item) => {
      const monthKey = item.period; // Should be in format "YYYY-MM"
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += item.amount;
      return acc;
    }, {});

    // Convert to arrays sorted by date
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const amounts = sortedMonths.map(month => monthlyTotals[month]);
    
    // Format labels as "MMM YYYY"
    const formattedLabels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(year, monthNum - 1);
      return date.toLocaleDateString('en-KE', { 
        month: 'short', 
        year: 'numeric' 
      });
    });

    setSalesTrend(prev => ({
      ...prev,
      monthly: {
        data: amounts,
        labels: formattedLabels,
        loading: false,
        error: null
      }
    }));

  } catch (err) {
    console.error("Failed to fetch monthly sales trend:", err);
    setSalesTrend(prev => ({
      ...prev,
      monthly: {
        ...prev.monthly,
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to load monthly sales data"
      }
    }));
  }
};










  const fetchActiveDiscounts = async () => {
    try {
      setLoading(prev => ({ ...prev, discounts: true }));
      setError(prev => ({ ...prev, discounts: null }));
      
      const response = await axios.get(`${API_BASE_URL}/discounts/active`, getAuthHeader());
      setActiveDiscounts(response.data || []);
    } catch (err) {
      console.error("Failed to fetch active discounts:", err);
      setError(prev => ({ ...prev, discounts: err.response?.data?.message || err.message }));
    } finally {
      setLoading(prev => ({ ...prev, discounts: false }));
    }
  };

  // Chart configurations
  const dailyChartData = {
    labels: salesTrend.daily.labels,
    datasets: [
      {
        label: 'Daily Sales (KSH)',
        data: salesTrend.daily.data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6'
      }
    ]
  };

  const monthlyChartData = {
    labels: salesTrend.monthly.labels,
    datasets: [
      {
        label: 'Monthly Sales (KSH)',
        data: salesTrend.monthly.data,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4, // Add rounded corners to bars
        borderSkipped: false,
      }
    ]
  };

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `KSH ${context.raw.toLocaleString('en-KE')}`;
        },
        title: (context) => {
          return context[0].label || 'Month';
        }
      }
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `KSH ${value.toLocaleString('en-KE')}`
      },
      grid: {
        drawBorder: false,
        color: 'rgba(0, 0, 0, 0.05)',
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      }
    }
  }
};
  // Initialize component
  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    // Initial data fetch
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchDailySalesTrend(),
          fetchMonthlySalesTrend(),
          fetchActiveDiscounts()
        ]);
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      }
    };
    
    fetchData();

    // Set up polling
    const dashboardInterval = setInterval(fetchDashboardData, 300000);
    const dailyTrendInterval = setInterval(fetchDailySalesTrend, 900000);
    const monthlyTrendInterval = setInterval(fetchMonthlySalesTrend, 3600000);

    return () => {
      clearInterval(dashboardInterval);
      clearInterval(dailyTrendInterval);
      clearInterval(monthlyTrendInterval);
    };
  }, []);

  return (
    <div className="p-4 md:p-6">
      {/* Top Bar with Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {getTimeOfDay()}, {userName} 👋
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Track your sales and performance here!</p>
        </div>
      </div>

      {/* Error display */}
      {error.dashboard && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Error loading dashboard data: {error.dashboard}</p>
        </div>
      )}

      {/* Summary Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sale SubTotal</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-blue-600">
            {formatKES(dashboardData.summary.subtotal)}
          </p>
        </div>
        
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sale Discount</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-red-500">
            {formatKES(dashboardData.summary.discount)}
          </p>
          {!loading.discounts && activeDiscounts.length > 0 && (
            <p className="text-xs md:text-sm mt-1 text-gray-500">
              {activeDiscounts.length} active discount{activeDiscounts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sale Total</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-green-600">
            {formatKES(dashboardData.summary.total)}
          </p>
        </div>
        
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sales Profit</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-purple-600">
            {loading.dashboard ? (
              <span className="inline-block h-8 w-24 bg-gray-200 rounded animate-pulse"></span>
            ) : (
              formatKES(dashboardData.profitData.totalProfit)
            )}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
          <div className="bg-blue-100 p-2 md:p-3 rounded-full mr-3 md:mr-4">
            <FiTrendingUp className="text-blue-600 text-lg md:text-xl" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-600">Total Sales</h2>
            <p className="text-xl md:text-2xl font-bold mt-1">
              {dashboardData.summary.totalSales}
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
          <div className="bg-green-100 p-2 md:p-3 rounded-full mr-3 md:mr-4">
            <FaBoxes className="text-green-600 text-lg md:text-xl" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-600">Inventory Items</h2>
            <p className="text-xl md:text-2xl font-bold mt-1">
              {loading.dashboard ? (
                <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                dashboardData.summary.inventoryCount
              )}
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
          <div className="bg-yellow-100 p-2 md:p-3 rounded-full mr-3 md:mr-4">
            <FaExclamationTriangle className="text-yellow-600 text-lg md:text-xl" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-600">Low Stock Items</h2>
            <p className="text-xl md:text-2xl font-bold mt-1">
              {loading.dashboard ? (
                <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                dashboardData.summary.lowStockItemsCount
              )}
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
          <div className="bg-red-100 p-2 md:p-3 rounded-full mr-3 md:mr-4">
            <FaCalendarAlt className="text-red-600 text-lg md:text-xl" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-600">Expired Items</h2>
            <p className="text-xl md:text-2xl font-bold mt-1">
              {loading.dashboard ? (
                <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                dashboardData.summary.expiredItemsCount
              )}
            </p>
          </div>
        </div>
      </div>









      {/* Sales Trends Section */}
      <div className="mb-6 md:mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Sales Trends</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Daily Sales Line Chart */}
          <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Daily Sales Trend</h3>
            <div className="h-64 md:h-80">
              {salesTrend.daily.loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading daily sales data...</div>
                </div>
              ) : salesTrend.daily.error ? (
                <div className="h-full flex items-center justify-center text-red-500">
                  Error: {salesTrend.daily.error}
                </div>
              ) : salesTrend.daily.data.length > 0 ? (
                <Line data={dailyChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No daily sales data available
                </div>
              )}
            </div>
          </div>

          {/* Monthly Sales Bar Chart */}
          <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Monthly Sales Performance</h3>
              <div className="h-64 md:h-80">
                {salesTrend.monthly.loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading monthly sales data...</div>
                  </div>
                ) : salesTrend.monthly.error ? (
                  <div className="h-full flex items-center justify-center text-red-500">
                    Error: {salesTrend.monthly.error}
                    <button 
                      onClick={fetchMonthlySalesTrend}
                      className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : salesTrend.monthly.data.length > 0 ? (
                  <Bar 
                    data={monthlyChartData} 
                    options={chartOptions} 
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No monthly sales data available
                    <button 
                      onClick={fetchMonthlySalesTrend}
                      className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div> {/* This closes the grid container */}
      </div> {/* This closes the Sales Trends section */}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        {/* Active Discounts */}
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Active Discounts</h2>
            <FaTag className="text-purple-500" />
          </div>
          
          {loading.discounts ? (
            <div className="space-y-3 md:space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error.discounts ? (
            <div className="text-red-500">Error: {error.discounts}</div>
          ) : Array.isArray(activeDiscounts) && activeDiscounts.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {activeDiscounts.slice(0, 5).map((discount, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-sm md:text-base">
                      {discount.code || discount.name || 'Discount'}
                    </p>
                    <span className="text-purple-600 font-semibold text-sm md:text-base">
                      {discount.percentage || discount.value || 0}% off
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    {discount.description || 'No description'}
                  </p>
                  <div className="text-xs text-gray-500 mb-2">
                    Valid until: {formatDiscountDate(discount.validTo)}
                  </div>
                  {discount.applicableProducts && Array.isArray(discount.applicableProducts) && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Applicable Products:</p>
                      <div className="space-y-1">
                        {discount.applicableProducts.slice(0, 3).map((product, idx) => (
                          <div key={idx} className="flex items-center text-xs">
                            <span className="text-gray-700">• {product.name || product.productName || 'Product'}</span>
                          </div>
                        ))}
                        {discount.applicableProducts.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{discount.applicableProducts.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No active discounts</div>
          )}
        </div>

        {/* Top Products */}
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Top Products</h2>
            <FiTrendingUp className="text-blue-500" />
          </div>
          
          {loading.dashboard ? (
            <div className="space-y-3 md:space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error.dashboard ? (
            <div className="text-red-500">Error: {error.dashboard}</div>
          ) : Array.isArray(dashboardData.topProducts) && dashboardData.topProducts.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {product.productImage && (
                      <img 
                        src={product.productImage} 
                        alt={product.productName}
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                    )}
                    <span className="font-medium text-sm md:text-base">{product.productName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 font-semibold block text-sm md:text-base">{product.unitsSold} sold</span>
                    <span className="text-gray-500 text-xs block">{formatKES(product.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No products sold yet</div>
          )}
        </div>

        {/* Low Stock Items */}
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Low Stock Items</h2>
            <FaExclamationTriangle className="text-red-500" />
          </div>
          
          {loading.dashboard ? (
            <div className="space-y-3 md:space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error.dashboard ? (
            <div className="text-red-500">Error: {error.dashboard}</div>
          ) : Array.isArray(dashboardData.lowStockItems) && dashboardData.lowStockItems.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {dashboardData.lowStockItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium text-sm md:text-base">{item.productName || item.name || 'Unknown Product'}</span>
                  <div className="text-right">
                    {item.lowStockThreshold && (
                      <span className="text-red-600 font-semibold text-sm md:text-base block">
                        Threshold: <span className="text-gray-700">{item.lowStockThreshold}</span>
                      </span>
                    )}
                    <span className="text-gray-500 text-xs block">
                      Stock: {item.quantityInStock || item.quantity_in_stock || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No low stock items</div>
          )}
        </div>
      </div>

      {/* Recent Sales Section */}
      <div className="mt-4 md:mt-6 p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Recent Sales</h2>
          <FaHistory className="text-gray-500" />
        </div>
        
        {loading.dashboard ? (
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="grid grid-cols-4 gap-3 md:gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
              </div>
            ))}
          </div>
        ) : error.dashboard ? (
          <div className="text-red-500">Error loading recent sales: {error.dashboard}</div>
        ) : Array.isArray(dashboardData.recentSales) && dashboardData.recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">#{sale.id}</td>
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">{formatDate(sale.saleDate || sale.createdAt)}</td>
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">{formatKES(sale.subtotal)}</td>
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">{formatKES(sale.discountAmount)}</td>
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-green-600">{formatKES(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">No recent sales found</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardControl;