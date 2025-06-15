import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
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
} from "chart.js";
import { FaBell, FaSearch, FaBoxes, FaExclamationTriangle, FaHistory, FaCalendarAlt } from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { getSales } from '../../services/salesService';
import { InventoryService } from '../../services/InventoryService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:8080/api/sales';

// Helper function to get auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const Dashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState({
    sales: true,
    summary: true,
    topProducts: true,
    lowStock: true,
    recentSales: true,
    expiringItems: true,
    salesTrend: true,
    customers: true,
    inventory: true
  });
  const [error, setError] = useState({
    sales: null,
    summary: null,
    topProducts: null,
    lowStock: null,
    recentSales: null,
    expiringItems: null,
    salesTrend: null,
    customers: null,
    inventory: null
  });
  
  // Dashboard data states
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    discount: 0,
    total: 0,
    salesProfit: 0,
    totalSales: 0,
    inventoryCount: 0,
    customerCount: 0,
    expiredItemsCount: 0,
    lowStockItemsCount: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [expiringAndExpiredItems, setExpiringAndExpiredItems] = useState([]);
  const [salesTrend, setSalesTrend] = useState({ 
    daily: [], 
    monthly: [],
    dailyLabels: [],
    monthlyLabels: []
  });

  // Format Kenyan Shillings
  const formatKES = (amount) => {
    if (isNaN(amount)) return "KES 0";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get current time of day for greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  // Calculate summary from sales data
  const calculateSummary = (salesData) => {
    if (!salesData || salesData.length === 0) {
      return {
        subtotal: 0,
        discount: 0,
        total: 0,
        salesProfit: 0,
        totalSales: 0,
        inventoryCount: 0,
        customerCount: 0,
        expiredItemsCount: 0,
        lowStockItemsCount: 0
      };
    }

    const subtotal = salesData.reduce((sum, sale) => sum + (sale.subtotal || 0), 0);
    const discount = salesData.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0);
    const total = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const salesProfit = salesData.reduce((sum, sale) => {
      const profit = (sale.total || 0) - (sale.cost_of_goods || 0) - (sale.discount_amount || 0);
      return sum + (profit > 0 ? profit : 0);
    }, 0);

    return {
      subtotal,
      discount,
      total,
      salesProfit,
      totalSales: salesData.length,
      inventoryCount: summary.inventoryCount,
      customerCount: summary.customerCount,
      expiredItemsCount: summary.expiredItemsCount,
      lowStockItemsCount: summary.lowStockItemsCount
    };
  };

  // Check if a product is expired
  const isProductExpired = (expiryDate) => {
    return expiryDate ? new Date() > new Date(expiryDate) : false;
  };

  // Process sales data for daily trends
  const processDailySales = (salesData) => {
    const dailyTotals = {};
    
    salesData.forEach(sale => {
      const saleDate = new Date(sale.sale_date);
      const dayKey = saleDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!dailyTotals[dayKey]) {
        dailyTotals[dayKey] = 0;
      }
      dailyTotals[dayKey] += sale.total || 0;
    });
    
    return {
      days: Object.keys(dailyTotals),
      amounts: Object.values(dailyTotals)
    };
  };

  // Process sales data for monthly trends
  const processMonthlySales = (salesData) => {
    const monthlyTotals = {};
    
    salesData.forEach(sale => {
      const saleDate = new Date(sale.sale_date);
      const monthKey = saleDate.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = 0;
      }
      monthlyTotals[monthKey] += sale.total || 0;
    });
    
    return {
      months: Object.keys(monthlyTotals),
      amounts: Object.values(monthlyTotals)
    };
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      setLoading(prev => ({ ...prev, inventory: true }));
      
      const inventoryResponse = await InventoryService.getInventoryStatus(
        '', null, null, false, false, { page: 0, size: 1000 }
      );
      
      const totalItems = inventoryResponse.totalElements;
      const expiredItems = inventoryResponse.content.filter(product => 
        product.expiryDate && isProductExpired(product.expiryDate)
      );
      const lowStockItems = inventoryResponse.content.filter(product => 
        product.quantityInStock <= product.lowStockThreshold
      );
      
      setSummary(prev => ({
        ...prev,
        inventoryCount: totalItems,
        expiredItemsCount: expiredItems.length,
        lowStockItemsCount: lowStockItems.length
      }));
      
      setError(prev => ({ ...prev, inventory: null }));
    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
      setError(prev => ({ ...prev, inventory: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('userName');
    
    if (token) {
      setIsLoggedIn(true);
      if (storedName) {
        setUserName(storedName);
      }
    }
  }, []);

  // Fetch data from backend API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Only fetch data if user is logged in
        const token = localStorage.getItem('token');
        if (!token) return;

        // First fetch inventory data which will be used for counts
        await fetchInventoryData();
        
        // Then fetch sales data which will be used to calculate summary
        await fetchSales();
        
        // Then fetch other dashboard data
        await Promise.all([
          fetchTopProducts(),
          fetchLowStockItems(),
          fetchExpiringAndExpiredItems(),
          fetchCustomerCount()
        ]);
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch sales data
  const fetchSales = async () => {
    setLoading(prev => ({ ...prev, sales: true, salesTrend: true }));
    setError(prev => ({ ...prev, sales: null, salesTrend: null }));
    
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch sales');
      
      const data = await response.json();
      setSales(data);
      setRecentSales(data.slice(0, 5));
      
      // Process data for charts
      const dailySales = processDailySales(data);
      const monthlySales = processMonthlySales(data);
      
      setSalesTrend({
        daily: dailySales.amounts,
        dailyLabels: dailySales.days,
        monthly: monthlySales.amounts,
        monthlyLabels: monthlySales.months
      });
      
      setSummary(prev => ({
        ...calculateSummary(data),
        inventoryCount: prev.inventoryCount,
        customerCount: prev.customerCount,
        expiredItemsCount: prev.expiredItemsCount,
        lowStockItemsCount: prev.lowStockItemsCount
      }));
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      setError(prev => ({ ...prev, sales: err.message, salesTrend: err.message }));
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        sales: false, 
        summary: false, 
        recentSales: false,
        salesTrend: false
      }));
    }
  };

  // Fetch customer count
  const fetchCustomerCount = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    setError(prev => ({ ...prev, customers: null }));
    
    try {
      const response = await fetch('http://localhost:8080/api/customers', {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setSummary(prev => ({
        ...prev,
        customerCount: data.length
      }));
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(prev => ({ ...prev, customers: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  // Fetch top selling products
  const fetchTopProducts = async () => {
    setLoading(prev => ({ ...prev, topProducts: true }));
    setError(prev => ({ ...prev, topProducts: null }));
    
    try {
      const response = await fetch('http://localhost:8080/api/dashboard/top-products', {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch top products');
      const data = await response.json();
      setTopProducts(data);
    } catch (err) {
      console.error("Failed to fetch top products:", err);
      setError(prev => ({ ...prev, topProducts: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, topProducts: false }));
    }
  };

  // Fetch low stock items
  const fetchLowStockItems = async () => {
    setLoading(prev => ({ ...prev, lowStock: true }));
    setError(prev => ({ ...prev, lowStock: null }));
    
    try {
      const response = await fetch('http://localhost:8080/api/dashboard/low-stock', {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch low stock items');
      const data = await response.json();
      setLowStockItems(data);
    } catch (err) {
      console.error("Failed to fetch low stock items:", err);
      setError(prev => ({ ...prev, lowStock: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, lowStock: false }));
    }
  };

  // Fetch expiring and expired items
  const fetchExpiringAndExpiredItems = async () => {
    setLoading(prev => ({ ...prev, expiringItems: true }));
    setError(prev => ({ ...prev, expiringItems: null }));
    
    try {
      const response = await fetch('http://localhost:8080/api/dashboard/expiring-items', {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch expiring items');
      const data = await response.json();
      
      const processedItems = data.map(item => ({
        ...item,
        status: isProductExpired(item.expiryDate) ? 'expired' : 'expiring'
      }));
      
      setExpiringAndExpiredItems(processedItems);
    } catch (err) {
      console.error("Failed to fetch expiring items:", err);
      setError(prev => ({ ...prev, expiringItems: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, expiringItems: false }));
    }
  };

  // Daily sales chart data with black and blue theme
  const dailyChartData = {
    labels: salesTrend.dailyLabels,
    datasets: [
      {
        label: 'Daily Sales (KES)',
        data: salesTrend.daily,
        borderColor: '#3b82f6', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue with opacity
        tension: 0.3,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1
      }
    ]
  };

  // Monthly sales chart data with blue bars
  const monthlyChartData = {
    labels: salesTrend.monthlyLabels,
    datasets: [
      {
        label: 'Monthly Sales (KES)',
        data: salesTrend.monthly,
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Semi-transparent blue
        borderColor: '#1d4ed8', // Darker blue
        borderWidth: 1,
        hoverBackgroundColor: '#3b82f6', // Blue on hover
        hoverBorderColor: '#1d4ed8'
      }
    ]
  };

  // Chart options with KES formatting
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: value => formatKES(value)
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: context => formatKES(context.raw)
        }
      },
      legend: {
        position: 'top',
        labels: {
          font: {
            weight: 'bold'
          }
        }
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format expiry date for display
  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4">
      {/* Top Bar with Greeting and Search */}
      <div className="flex justify-between items-center mb-8">
        {isLoggedIn ? (
          <div>
            <h1 className="text-2xl font-bold">
              {getTimeOfDay()}, {userName} 👋
            </h1>
            <p className="text-gray-600">Track your sales and performance here!</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
            <p className="text-gray-600">Please login to access your data</p>
          </div>
        )}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
          </div>
          <FaBell className="text-xl text-gray-600 cursor-pointer" />
        </div>
      </div>

      {isLoggedIn ? (
        <>
          {/* Summary Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-600">Sale SubTotal</h2>
              <p className="text-3xl font-bold mt-2 text-blue-600">
                {formatKES(summary.subtotal)}
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-600">Sale Discount</h2>
              <p className="text-3xl font-bold mt-2 text-red-500">
                {summary.discount > 0 ? `-${formatKES(summary.discount)}` : formatKES(0)}
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-600">Sale Total</h2>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {formatKES(summary.total)}
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-600">Sales Profit</h2>
              <p className="text-3xl font-bold mt-2 text-purple-600">
                {formatKES(summary.salesProfit)}
              </p>
            </div>
          </div>

          {/* Secondary Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiTrendingUp className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Total Sales</h2>
                <p className="text-2xl font-bold mt-1">
                  {summary.totalSales}
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FaBoxes className="text-green-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Inventory Items</h2>
                <p className="text-2xl font-bold mt-1">
                  {loading.inventory ? (
                    <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    summary.inventoryCount
                  )}
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="text-yellow-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Low Stock Items</h2>
                <p className="text-2xl font-bold mt-1">
                  {loading.inventory ? (
                    <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    summary.lowStockItemsCount
                  )}
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <FaCalendarAlt className="text-red-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Expired Items</h2>
                <p className="text-2xl font-bold mt-1">
                  {loading.inventory ? (
                    <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    summary.expiredItemsCount
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Sales Trends Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sales Trends</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Sales Line Chart */}
              <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Daily Sales Trend</h3>
                <div className="h-80">
                  {loading.salesTrend ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-pulse text-gray-400">Loading daily sales data...</div>
                    </div>
                  ) : error.salesTrend ? (
                    <div className="h-full flex items-center justify-center text-red-500">
                      Error: {error.salesTrend}
                    </div>
                  ) : salesTrend.daily.length > 0 ? (
                    <Line 
                      data={dailyChartData}
                      options={chartOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No daily sales data available
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Sales Bar Chart */}
              <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Monthly Sales Performance</h3>
                <div className="h-80">
                  {loading.salesTrend ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-pulse text-gray-400">Loading monthly sales data...</div>
                    </div>
                  ) : error.salesTrend ? (
                    <div className="h-full flex items-center justify-center text-red-500">
                      Error: {error.salesTrend}
                    </div>
                  ) : salesTrend.monthly.length > 0 ? (
                    <Bar
                      data={monthlyChartData}
                      options={chartOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No monthly sales data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Top Products */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Top Products</h2>
                <FiTrendingUp className="text-blue-500" />
              </div>
              
              {loading.topProducts ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex justify-between items-center">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : error.topProducts ? (
                <div className="text-red-500">Error: {error.topProducts}</div>
              ) : topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        {product.productImage && (
                          <img 
                            src={product.productImage} 
                            alt={product.productName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        )}
                        <span className="font-medium">{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-600 font-semibold block">{product.unitsSold} sold</span>
                        <span className="text-gray-500 text-xs block">{formatKES(product.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No products sold yet</div>
              )}
            </div>

            {/* Expiring and Expired Items */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Expiring/Expired Items</h2>
                <FaCalendarAlt className="text-yellow-500" />
              </div>
              
              {loading.expiringItems ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex justify-between items-center">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : error.expiringItems ? (
                <div className="text-red-500">Error: {error.expiringItems}</div>
              ) : expiringAndExpiredItems.length > 0 ? (
                <div className="space-y-4">
                  {expiringAndExpiredItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'expired' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formatExpiryDate(item.expiryDate)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No items expiring soon or expired</div>
              )}
            </div>
          </div>

          {/* Recent Sales Section */}
          <div className="mt-6 p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Sales</h2>
              <FaHistory className="text-gray-500" />
            </div>
            
            {loading.recentSales ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="grid grid-cols-4 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse col-span-1"></div>
                  </div>
                ))}
              </div>
            ) : error.recentSales ? (
              <div className="text-red-500">Error loading recent sales: {error.recentSales}</div>
            ) : recentSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.map((sale) => {
                      const profit = (sale.total || 0) - (sale.cost_of_goods || 0) - (sale.discount_amount || 0);
                      return (
                        <tr key={sale.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{sale.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.sale_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sale.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatKES(sale.subtotal)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatKES(sale.discount_amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatKES(profit)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatKES(sale.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">No recent sales found</div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Please login to view dashboard</h2>
          <p className="text-gray-500">You need to be authenticated to access this content.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;