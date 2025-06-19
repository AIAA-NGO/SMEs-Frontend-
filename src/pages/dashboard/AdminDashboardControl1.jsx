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
  Filler
} from "chart.js";
import { FaBell, FaSearch, FaBoxes, FaExclamationTriangle, FaHistory, FaCalendarAlt, FaTag } from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { getSales } from '../../services/salesService';
import { InventoryService } from '../../services/InventoryService';
import { getAllProducts } from '../../services/productServices';

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

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/sales`;
const REPORTS_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/reports`;
const DISCOUNTS_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/discounts`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const Dashboard = () => {
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
    inventory: true,
    profit: true,
    discounts: true
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
    inventory: null,
    profit: null,
    discounts: null
  });
  
  const [sales, setSales] = useState([]);
  const [profitData, setProfitData] = useState({
    totalProfit: 0,
    totalRevenue: 0,
    totalCost: 0,
    profitMargin: 0
  });
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
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [salesTrend, setSalesTrend] = useState({ 
    daily: [], 
    monthly: [],
    dailyLabels: [],
    monthlyLabels: []
  });

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
    const discount = salesData.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0);
    const total = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalSales = salesData.length;

    return {
      subtotal,
      discount,
      total,
      salesProfit: profitData.totalProfit,
      totalSales,
      inventoryCount: summary.inventoryCount,
      customerCount: summary.customerCount,
      expiredItemsCount: summary.expiredItemsCount,
      lowStockItemsCount: summary.lowStockItemsCount
    };
  };

  const isProductExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date() > new Date(expiryDate);
  };

  const processDailySales = (salesData) => {
    const dailyTotals = {};
    
    salesData.forEach(sale => {
      const saleDate = new Date(sale.saleDate || sale.createdAt || new Date());
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

  const processMonthlySales = (salesData) => {
    const monthlyTotals = {};
    
    salesData.forEach(sale => {
      const saleDate = new Date(sale.saleDate || sale.createdAt || new Date());
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

  const fetchActiveDiscounts = async () => {
    try {
      setLoading(prev => ({ ...prev, discounts: true }));
      setError(prev => ({ ...prev, discounts: null }));
      
      const response = await fetch(`${DISCOUNTS_BASE_URL}/active`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to fetch active discounts');
      
      let data;
      try {
        data = await response.json();
        if (!Array.isArray(data)) {
          if (data.data && Array.isArray(data.data)) {
            data = data.data;
          } else {
            data = [];
          }
        }
      } catch (parseError) {
        console.error("Failed to parse discounts response:", parseError);
        data = [];
      }
      
      setActiveDiscounts(data);
    } catch (err) {
      console.error("Failed to fetch active discounts:", err);
      setError(prev => ({ ...prev, discounts: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, discounts: false }));
    }
  };

  const fetchProfitData = async () => {
    try {
      setLoading(prev => ({ ...prev, profit: true }));
      setError(prev => ({ ...prev, profit: null }));
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      const response = await fetch(
        `${REPORTS_BASE_URL}/products?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`, 
        {
          headers: getAuthHeader()
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch profit data');
      
      const data = await response.json();
      
      let totalProfit = 0;
      let totalRevenue = 0;
      let totalCost = 0;
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          const revenue = item.revenue || 0;
          const cost = item.cost || 0;
          const profit = item.profit || 0;
          
          totalRevenue += revenue;
          totalCost += cost;
          totalProfit += profit;
        });
      }
      
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      
      setProfitData({
        totalProfit,
        totalRevenue,
        totalCost,
        profitMargin
      });
      
      setSummary(prev => ({
        ...prev,
        salesProfit: totalProfit
      }));
    } catch (err) {
      console.error("Failed to fetch profit data:", err);
      setError(prev => ({ ...prev, profit: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, profit: false }));
    }
  };

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
      
      const dailySales = processDailySales(data);
      const monthlySales = processMonthlySales(data);
      
      setSalesTrend({
        daily: dailySales.amounts,
        dailyLabels: dailySales.days,
        monthly: monthlySales.amounts,
        monthlyLabels: monthlySales.months
      });
      
      const salesWithProfit = data.map(sale => {
        let saleProfit = 0;
        let saleCost = 0;
        
        if (sale.saleItems && sale.saleItems.length > 0) {
          sale.saleItems.forEach(item => {
            const unitPrice = item.unitPrice || 0;
            const costPrice = item.costPrice || 0;
            const quantity = item.quantity || 0;
            
            saleProfit += (unitPrice - costPrice) * quantity;
            saleCost += costPrice * quantity;
          });
        }
        
        return { ...sale, profit: saleProfit, cost: saleCost };
      });
      
      setRecentSales(salesWithProfit.slice(0, 5));
      
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

  const fetchCustomerCount = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    setError(prev => ({ ...prev, customers: null }));
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/customers`, {
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

  const fetchTopProducts = async () => {
    setLoading(prev => ({ ...prev, topProducts: true }));
    setError(prev => ({ ...prev, topProducts: null }));
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/dashboard/top-products`, {
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

  const fetchLowStockItems = async () => {
    setLoading(prev => ({ ...prev, lowStock: true }));
    setError(prev => ({ ...prev, lowStock: null }));
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/dashboard/low-stock`, {
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

  const fetchExpiringAndExpiredItems = async () => {
    setLoading(prev => ({ ...prev, expiringItems: true }));
    setError(prev => ({ ...prev, expiringItems: null }));
    
    try {
      const allProducts = await getAllProducts();
      
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const expiringItems = allProducts.filter(product => {
        if (!product.expiry_date) return false;
        const expiryDate = new Date(product.expiry_date);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
      });
      
      const expiredItems = allProducts.filter(product => {
        if (!product.expiry_date) return false;
        return isProductExpired(product.expiry_date);
      });
      
      const processedItems = [
        ...expiringItems.map(item => ({
          id: item.id,
          productName: item.name || 'Unknown Product',
          expiryDate: item.expiry_date,
          status: 'expiring'
        })),
        ...expiredItems.map(item => ({
          id: item.id,
          productName: item.name || 'Unknown Product',
          expiryDate: item.expiry_date,
          status: 'expired'
        }))
      ];
      
      setExpiringAndExpiredItems(processedItems);
    } catch (err) {
      console.error("Failed to fetch expiring items:", err);
      setError(prev => ({ ...prev, expiringItems: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, expiringItems: false }));
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedName = localStorage.getItem("userName");
        if (storedName) setUserName(storedName);

        await fetchInventoryData();
        await Promise.all([
          fetchSales(),
          fetchProfitData(),
          fetchTopProducts(),
          fetchLowStockItems(),
          fetchExpiringAndExpiredItems(),
          fetchCustomerCount(),
          fetchActiveDiscounts()
        ]);
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      }
    };

    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const dailyChartData = {
    labels: salesTrend.dailyLabels,
    datasets: [
      {
        label: 'Daily Sales (KSH)',
        data: salesTrend.daily,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: {
          target: 'origin',
          above: 'rgba(59, 130, 246, 0.1)'
        },
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1
      }
    ]
  };

  const monthlyChartData = {
    labels: salesTrend.monthlyLabels,
    datasets: [
      {
        label: 'Monthly Sales (KSH)',
        data: salesTrend.monthly,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#1d4ed8',
        borderWidth: 1,
        hoverBackgroundColor: '#3b82f6',
        hoverBorderColor: '#1d4ed8'
      }
    ]
  };

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

  const formatExpiryDate = (dateString) => {
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

  return (
    <div className="p-4 md:p-6">
      {/* Top Bar with Greeting and Search - Responsive */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {getTimeOfDay()}, {userName} 👋
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Track your sales and performance here!</p>
        </div>
        <div className="flex items-center w-full md:w-auto gap-3">
          <div className="relative flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none w-full md:w-64"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
          </div>
          <FaBell className="text-xl text-gray-600 cursor-pointer" />
        </div>
      </div>

      {/* Summary Metrics Section - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sale SubTotal</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-blue-600">
            {formatKES(summary.subtotal)}
          </p>
        </div>
        
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sale Discount</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-red-500">
            {formatKES(summary.discount)}
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
            {formatKES(summary.total)}
          </p>
        </div>
        
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-600">Sales Profit</h2>
          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-purple-600">
            {loading.profit ? (
              <span className="inline-block h-8 w-24 bg-gray-200 rounded animate-pulse"></span>
            ) : (
              formatKES(profitData.totalProfit)
            )}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Section - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200 flex items-center">
          <div className="bg-blue-100 p-2 md:p-3 rounded-full mr-3 md:mr-4">
            <FiTrendingUp className="text-blue-600 text-lg md:text-xl" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-600">Total Sales</h2>
            <p className="text-xl md:text-2xl font-bold mt-1">
              {summary.totalSales}
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
              {loading.inventory ? (
                <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                summary.inventoryCount
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
              {loading.inventory ? (
                <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                summary.lowStockItemsCount
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
              {loading.inventory ? (
                <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                summary.expiredItemsCount
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Sales Trends Section - Responsive */}
      <div className="mb-6 md:mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Sales Trends</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Daily Sales Line Chart */}
          <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Daily Sales Trend</h3>
            <div className="h-64 md:h-80">
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
          <div className="p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Monthly Sales Performance</h3>
            <div className="h-64 md:h-80">
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

      {/* Bottom Section - Responsive Grid */}
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
          ) : activeDiscounts.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {activeDiscounts.slice(0, 5).map((discount, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm md:text-base">{discount.code || discount.name || 'Discount'}</p>
                    <p className="text-xs md:text-sm text-gray-500">{discount.description || 'No description'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-600 font-semibold block text-sm md:text-base">
                      {discount.percentage || discount.value || 0}% off
                    </span>
                    <span className="text-gray-500 text-xs block">
                      Valid until: {formatDiscountDate(discount.validTo)}
                    </span>
                  </div>
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
          
          {loading.topProducts ? (
            <div className="space-y-3 md:space-y-4">
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
            <div className="space-y-3 md:space-y-4">
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
          
          {loading.lowStock ? (
            <div className="space-y-3 md:space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error.lowStock ? (
            <div className="text-red-500">Error: {error.lowStock}</div>
          ) : lowStockItems.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {lowStockItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium text-sm md:text-base">{item.productName || item.name || 'Unknown Product'}</span>
                  <span className="text-red-600 font-semibold">
                    {item.quantityInStock || item.quantity_in_stock || 0} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No low stock items</div>
          )}
        </div>
      </div>

      {/* Recent Sales Section - Responsive */}
      <div className="mt-4 md:mt-6 p-4 md:p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Recent Sales</h2>
          <FaHistory className="text-gray-500" />
        </div>
        
        {loading.recentSales ? (
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
        ) : error.recentSales ? (
          <div className="text-red-500">Error loading recent sales: {error.recentSales}</div>
        ) : recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSales.map((sale) => (
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
                    <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {formatKES(sale.profit || 0)}
                    </td>
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

export default Dashboard;