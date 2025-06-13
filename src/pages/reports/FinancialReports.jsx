import React, { useState, useEffect } from 'react';
import { 
  getSalesReport, 
  getProductPerformanceReport, 
  getProfitLossReport,
  exportSalesReport,
  getSalesByDateRange
} from '../../services/salesService';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState('profitLoss');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [salesReport, setSalesReport] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Function to fetch all report data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [salesReportData, productData, profitLossData, sales] = await Promise.all([
        getSalesReport(startDate, endDate),
        getProductPerformanceReport(startDate, endDate),
        getProfitLossReport(startDate, endDate),
        getSalesByDateRange(startDate, endDate)
      ]);

      // Process product performance data to include profit calculations
      const processedProductData = productData.map(product => {
        const profit = product.totalRevenue - (product.unitCost * product.quantitySold);
        const profitMargin = product.totalRevenue > 0 ? (profit / product.totalRevenue) * 100 : 0;
        return {
          ...product,
          totalProfit: profit,
          profitMargin: profitMargin
        };
      });

      setSalesReport(salesReportData);
      setProductPerformance(processedProductData);
      setProfitLoss(profitLossData);
      setSalesData(sales);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or date range changes
  useEffect(() => {
    fetchData();
    
    // Set up interval for real-time updates (every 5 minutes)
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  // Manual refresh function
  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = async (format = 'CSV') => {
    try {
      const blob = await exportSalesReport(startDate, endDate, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${format(startDate, 'yyyyMMdd')}_to_${format(endDate, 'yyyyMMdd')}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed: ' + (err.message || 'Unknown error'));
    }
  };

  const formatCurrency = (value) => {
    if (isNaN(value) || value === null || value === undefined) return 'KSH 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const renderProfitLossReport = () => {
    if (!profitLoss) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Profit & Loss Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Revenue</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(profitLoss.totalRevenue)}</p>
              {profitLoss.revenueChange !== undefined && (
                <p className="text-sm text-blue-600">
                  {profitLoss.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(profitLoss.revenueChange || 0)}% from previous period
                </p>
              )}
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">Net Profit</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(profitLoss.netProfit)}</p>
              {profitLoss.profitMargin !== undefined && (
                <p className="text-sm text-green-600">
                  {profitLoss.profitMargin || 0}% profit margin
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">Cost of Goods Sold</h4>
              <p className="text-xl font-bold text-red-900">{formatCurrency(profitLoss.costOfGoodsSold)}</p>
              <p className="text-sm text-red-600">
                Based on {profitLoss.totalUnitsSold || 0} units sold
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800">Gross Profit</h4>
              <p className="text-xl font-bold text-orange-900">
                {formatCurrency(profitLoss.totalRevenue - profitLoss.costOfGoodsSold)}
              </p>
              <p className="text-sm text-orange-600">
                Gross Margin: {profitLoss.grossMargin || 0}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800">Operating Profit</h4>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(profitLoss.netProfit + profitLoss.taxes)}
              </p>
              <p className="text-sm text-purple-600">
                Operating Margin: {profitLoss.operatingMargin || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Cost Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesReport}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
                <Bar dataKey="totalCost" name="Cost" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderProductPerformance = () => {
    if (productPerformance.length === 0) return null;

    const topProducts = [...productPerformance]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Products (By Profit)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{
                  top: 20,
                  right: 30,
                  left: 40,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="productName" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#8884d8" />
                <Bar dataKey="totalProfit" name="Profit" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Product Profit Margins</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="profitMargin" name="Profit Margin (%)" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Product Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productPerformance.map((product) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantitySold || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.unitCost || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.unitPrice || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.totalRevenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.totalProfit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (product.profitMargin || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.profitMargin ? product.profitMargin.toFixed(2) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (salesData.length === 0) return null;

    // Calculate sales metrics
    const totalSales = salesData.length;
    const completedSales = salesData.filter(s => s.status === 'COMPLETED').length;
    const pendingSales = salesData.filter(s => s.status === 'PENDING').length;
    const cancelledSales = salesData.filter(s => s.status === 'CANCELLED').length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Total Sales</h4>
              <p className="text-2xl font-bold text-blue-900">{totalSales}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">Completed</h4>
              <p className="text-2xl font-bold text-green-900">{completedSales}</p>
              <p className="text-sm text-green-600">
                {(totalSales > 0 ? (completedSales / totalSales) * 100 : 0).toFixed(1)}% completion rate
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">Pending</h4>
              <p className="text-2xl font-bold text-yellow-900">{pendingSales}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">Cancelled</h4>
              <p className="text-2xl font-bold text-red-900">{cancelledSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800">Total Revenue</h4>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <h4 className="font-medium text-teal-800">Average Sale Value</h4>
              <p className="text-2xl font-bold text-teal-900">{formatCurrency(avgSaleValue)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-800">Items Sold</h4>
              <p className="text-2xl font-bold text-indigo-900">
                {salesData.reduce((sum, sale) => sum + (sale.items?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.slice(0, 10).map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.saleDate ? format(new Date(sale.saleDate), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(sale.subtotal || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(sale.discount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(sale.totalAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sale.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.items ? sale.items.length : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors self-end md:self-auto"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profitLoss')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'profitLoss'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveTab('productPerformance')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'productPerformance'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Product Performance
          </button>
          <button
            onClick={() => setActiveTab('salesReport')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'salesReport'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sales Report
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'profitLoss' && renderProfitLossReport()}
          {activeTab === 'productPerformance' && renderProductPerformance()}
          {activeTab === 'salesReport' && renderSalesReport()}
        </>
      )}
    </div>
  );
};

export default FinancialReports;