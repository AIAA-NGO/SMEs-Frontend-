import { useState, useEffect } from 'react';
import { DatePicker, Table, Button, Statistic, message, Card, Row, Col } from 'antd';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';
import { getAllProducts } from '../../services/productServices';
import { getCategories } from '../../services/productServices';
import { getProductPerformanceReport, exportReport } from '../../services/financialServices';

const ProductPerformanceReport = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgProfitMargin: 0
  });

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  // Columns configuration
  const columns = [
    { 
      title: 'Product ID', 
      dataIndex: 'productId', 
      key: 'productId',
      width: 120,
      fixed: 'left',
      sorter: (a, b) => a.productId - b.productId,
      responsive: ['md']
    },
    { 
      title: 'Product Name', 
      dataIndex: 'productName', 
      key: 'productName',
      width: 200,
      sorter: (a, b) => a.productName.localeCompare(b.productName),
      fixed: 'left'
    },
    { 
      title: 'Category', 
      dataIndex: 'categoryName', 
      key: 'category',
      width: 150,
      filters: [],
      onFilter: (value, record) => record.categoryName === value,
      sorter: (a, b) => a.categoryName.localeCompare(b.categoryName),
      responsive: ['md']
    },
    { 
      title: 'Cost Price', 
      dataIndex: 'costPrice', 
      key: 'costPrice',
      render: val => <span className="text-gray-600 font-medium">{formatCurrency(val)}</span>,
      width: 150,
      sorter: (a, b) => a.costPrice - b.costPrice,
      responsive: ['lg']
    },
    { 
      title: 'Selling Price', 
      dataIndex: 'sellingPrice', 
      key: 'sellingPrice',
      render: val => <span className="text-blue-600 font-medium">{formatCurrency(val)}</span>,
      width: 150,
      sorter: (a, b) => a.sellingPrice - b.sellingPrice,
      responsive: ['lg']
    },
    { 
      title: 'Units Sold', 
      dataIndex: 'unitsSold', 
      key: 'unitsSold',
      render: units => <span className="font-medium">{units}</span>,
      width: 120,
      sorter: (a, b) => a.unitsSold - b.unitsSold
    },
    { 
      title: 'Revenue', 
      dataIndex: 'revenue', 
      key: 'revenue',
      render: val => <span className="text-green-600 font-medium">{formatCurrency(val)}</span>,
      width: 150,
      sorter: (a, b) => a.revenue - b.revenue
    },
    { 
      title: 'Cost', 
      dataIndex: 'cost', 
      key: 'cost',
      render: val => <span className="text-gray-600 font-medium">{formatCurrency(val)}</span>,
      width: 150,
      sorter: (a, b) => a.cost - b.cost,
      responsive: ['lg']
    },
    { 
      title: 'Profit', 
      dataIndex: 'profit', 
      key: 'profit',
      render: val => (
        <span className={val >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {formatCurrency(val)}
        </span>
      ),
      width: 150,
      sorter: (a, b) => a.profit - b.profit
    },
    { 
      title: 'Profit Margin', 
      dataIndex: 'profitMargin', 
      key: 'profitMargin',
      render: val => (
        <span className={val >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {formatPercentage(val)}
        </span>
      ),
      width: 150,
      sorter: (a, b) => a.profitMargin - b.profitMargin,
      responsive: ['lg']
    },
  ];

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories');
      return [];
    }
  };

  // Fetch product performance report
  const fetchProductReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      // Fetch categories and products in parallel
      const [categoriesData, products] = await Promise.all([
        fetchCategories(),
        getAllProducts()
      ]);

      // Fetch sales data for the period
      const salesData = await getProductPerformanceReport(
        startDate.toDate(),
        endDate.toDate()
      );

      // Combine product data with sales data
      const processedData = products.map(product => {
        const salesInfo = salesData.find(item => item.productId === product.id) || {};
        
        const unitsSold = salesInfo.unitsSold || 0;
        const costPrice = product.cost_price || 0;
        const sellingPrice = product.price || 0;
        const revenue = unitsSold * sellingPrice;
        const cost = unitsSold * costPrice;
        const profit = revenue - cost;
        const profitMargin = (revenue > 0) ? (profit / revenue) * 100 : 0;

        // Find category name from categories data
        const productCategory = categoriesData.find(cat => cat.id === product.category_id);
        const categoryName = productCategory ? productCategory.name : 'Uncategorized';

        return {
          productId: product.id,
          productName: product.name || 'Unknown Product',
          categoryName,
          costPrice,
          sellingPrice,
          unitsSold,
          revenue,
          cost,
          profit,
          profitMargin
        };
      });

      setData(processedData);
      
      // Calculate summary statistics
      calculateSummary(processedData);
      
      // Update category filters
      updateCategoryFilters(processedData);
      
    } catch (error) {
      console.error('Error fetching product report:', error);
      message.error('Failed to fetch product performance data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateSummary = (reportData) => {
    const totalRevenue = reportData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalCost = reportData.reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    setSummaryData({
      totalProducts: reportData.length,
      totalRevenue,
      totalProfit,
      avgProfitMargin
    });
  };

  // Update category filters
  const updateCategoryFilters = (reportData) => {
    const uniqueCategories = [...new Set(reportData.map(item => item.categoryName))];
    const categoryColumn = columns.find(col => col.key === 'category');
    if (categoryColumn) {
      categoryColumn.filters = uniqueCategories.map(category => ({
        text: category,
        value: category
      }));
    }
  };

  // Export report
  const handleExport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setExportLoading(true);
    try {
      const blob = await exportReport({
        reportType: 'PRODUCT_PERFORMANCE',
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        format: 'PDF'
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `product-performance-${dayjs().format('YYYY-MM-DD')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      message.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProductReport();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Product Performance Report</h1>
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
          <Button 
            icon={<Download size={16} />} 
            onClick={handleExport}
            loading={exportLoading}
            className="bg-blue-600 text-white hover:bg-blue-700 w-full md:w-auto"
          >
            <span className="hidden md:inline">Export Report</span>
            <span className="md:hidden">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <Card className="mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <DatePicker
            placeholder="Start Date"
            value={startDate}
            onChange={setStartDate}
            className="w-full md:w-48"
            format="YYYY-MM-DD"
          />
          <DatePicker
            placeholder="End Date"
            value={endDate}
            onChange={setEndDate}
            className="w-full md:w-48"
            format="YYYY-MM-DD"
          />
          <Button 
            type="primary" 
            onClick={fetchProductReport}
            loading={loading}
            className="bg-green-600 text-white hover:bg-green-700 w-full md:w-auto"
          >
            Generate Report
          </Button>
        </div>
      </Card>
      
      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-4 md:mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Products" 
              value={summaryData.totalProducts} 
              valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Revenue" 
              value={formatCurrency(summaryData.totalRevenue)} 
              valueStyle={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Profit" 
              value={formatCurrency(summaryData.totalProfit)} 
              valueStyle={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: summaryData.totalProfit >= 0 ? '#16a34a' : '#dc2626' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Avg Profit Margin" 
              value={formatPercentage(summaryData.avgProfitMargin)} 
              valueStyle={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: summaryData.avgProfitMargin >= 0 ? '#16a34a' : '#dc2626' 
              }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Product Performance Table */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          rowKey="productId"
          scroll={{ x: true }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} products`,
            responsive: true
          }}
          size="small"
          className="responsive-table"
        />
      </Card>
    </div>
  );
};

export default ProductPerformanceReport;