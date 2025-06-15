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
import { message } from 'antd';

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

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [salesReportData, productData, profitLossData, sales] = await Promise.all([
        getSalesReport(startDate, endDate),
        getProductPerformanceReport(startDate, endDate),
        getProfitLossReport(startDate, endDate),
        getSalesByDateRange(startDate, endDate)
      ]);

      const processedProductData = productData.map(product => {
        const costOfGoodsSold = product.unitCost * product.quantitySold;
        const grossProfit = product.totalRevenue - costOfGoodsSold;
        const profitMargin = product.totalRevenue > 0 ? (grossProfit / product.totalRevenue) * 100 : 0;
        return {
          ...product,
          costOfGoodsSold,
          grossProfit,
          profitMargin
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

  const handleExport = async (exportFormat = 'CSV') => {
    try {
      setLoading(true);
      
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      let exportData = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        reportType: activeTab.toUpperCase(),
        format: exportFormat
      };

      switch(activeTab) {
        case 'profitLoss':
          exportData.data = {
            ...profitLoss,
            startDate: formattedStartDate,
            endDate: formattedEndDate
          };
          break;
        case 'productPerformance':
          exportData.data = productPerformance.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantitySold: item.quantitySold,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            totalRevenue: item.totalRevenue,
            costOfGoodsSold: item.costOfGoodsSold,
            grossProfit: item.grossProfit,
            profitMargin: item.profitMargin
          }));
          break;
        case 'salesReport':
          exportData.data = salesData.map(item => ({
            saleId: item.id,
            date: item.saleDate,
            customer: item.customerName,
            items: item.items.length,
            subtotal: item.subtotal,
            discount: item.discount,
            totalAmount: item.totalAmount,
            status: item.status
          }));
          break;
      }

      const response = await exportSalesReport(exportData);
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${formattedStartDate}_to_${formattedEndDate}.${exportFormat.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      message.success(`Report exported successfully as ${exportFormat}`);
    } catch (err) {
      console.error('Export failed:', err);
      message.error('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
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

  const calculateFinancialMetrics = () => {
    if (!productPerformance.length) return null;

    const totalRevenue = productPerformance.reduce((sum, product) => sum + (product.totalRevenue || 0), 0);
    const totalCOGS = productPerformance.reduce((sum, product) => sum + (product.costOfGoodsSold || 0), 0);
    const grossProfit = totalRevenue - totalCOGS;
    const operatingExpenses = profitLoss?.operatingExpenses || 0;
    const operatingProfit = grossProfit - operatingExpenses;
    const taxes = profitLoss?.taxes || 0;
    const netProfit = operatingProfit - taxes;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      operatingExpenses,
      operatingProfit,
      operatingProfitMargin: totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0,
      taxes,
      netProfit,
      netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  };

  const renderProfitLossReport = () => {
    const metrics = calculateFinancialMetrics();
    if (!metrics) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Profit & Loss Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Revenue</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">Gross Profit</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.grossProfit)}</p>
              <p className="text-sm text-green-600">
                {metrics.grossProfitMargin.toFixed(2)}% margin
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800">Net Profit</h4>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.netProfit)}</p>
              <p className="text-sm text-purple-600">
                {metrics.netProfitMargin.toFixed(2)}% margin
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
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
                <Bar dataKey="totalSales" name="Total Sales" fill="#8884d8" />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">Cost of Goods Sold</h4>
              <p className="text-xl font-bold text-red-900">{formatCurrency(metrics.totalCOGS)}</p>
              <p className="text-sm text-red-600">
                {(metrics.totalRevenue > 0 ? (metrics.totalCOGS / metrics.totalRevenue * 100) : 0).toFixed(2)}% of revenue
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800">Operating Expenses</h4>
              <p className="text-xl font-bold text-orange-900">{formatCurrency(metrics.operatingExpenses)}</p>
              <p className="text-sm text-orange-600">
                {(metrics.totalRevenue > 0 ? (metrics.operatingExpenses / metrics.totalRevenue * 100) : 0).toFixed(2)}% of revenue
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">Operating Profit</h4>
              <p className="text-xl font-bold text-yellow-900">{formatCurrency(metrics.operatingProfit)}</p>
              <p className="text-sm text-yellow-600">
                {metrics.operatingProfitMargin.toFixed(2)}% margin
              </p>
            </div>
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
          <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
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
                <Bar dataKey="grossProfit" name="Gross Profit" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Product</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalRevenue"
                  nameKey="productName"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COGS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
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
                      {formatCurrency(product.totalRevenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.costOfGoodsSold || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.grossProfit || 0)}
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

    const statusCounts = salesData.reduce((acc, sale) => {
      if (sale.status) {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
      }
      return acc;
    }, {});

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Total Sales</h4>
              <p className="text-2xl font-bold text-blue-900">{salesData.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">Completed</h4>
              <p className="text-2xl font-bold text-green-900">
                {salesData.filter(s => s.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">Pending</h4>
              <p className="text-2xl font-bold text-yellow-900">
                {salesData.filter(s => s.status === 'PENDING').length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">Cancelled</h4>
              <p className="text-2xl font-bold text-red-900">
                {salesData.filter(s => s.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
        <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('CSV')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export PDF'}
          </button>
          {lastUpdated && (
            <div className="text-sm text-gray-500 self-center">
              Last updated: {format(lastUpdated, 'MMM d, yyyy HH:mm')}
            </div>
          )}
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
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Apply Filters'}
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