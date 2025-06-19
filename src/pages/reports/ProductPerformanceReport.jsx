import { useState, useEffect } from 'react';
import { DatePicker, Table, Button, Statistic, message, Card, Row, Col } from 'antd';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';
import { getAllProducts } from '../../services/productServices';
import { getAllCategories } from '../../services/categories';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

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
      sorter: (a, b) => a.productId - b.productId
    },
    { 
      title: 'Product Name', 
      dataIndex: 'productName', 
      key: 'productName',
      width: 200,
      sorter: (a, b) => a.productName.localeCompare(b.productName)
    },
    { 
      title: 'Category', 
      dataIndex: 'categoryName', 
      key: 'category',
      width: 150,
      filters: [],
      onFilter: (value, record) => record.categoryName === value,
      sorter: (a, b) => a.categoryName.localeCompare(b.categoryName)
    },
    { 
      title: 'Cost Price', 
      dataIndex: 'costPrice', 
      key: 'costPrice',
      render: val => <span className="text-gray-600 font-medium">{formatCurrency(val)}</span>,
      width: 150,
      sorter: (a, b) => a.costPrice - b.costPrice
    },
    { 
      title: 'Selling Price', 
      dataIndex: 'sellingPrice', 
      key: 'sellingPrice',
      render: val => <span className="text-blue-600 font-medium">{formatCurrency(val)}</span>,
      width: 150,
      sorter: (a, b) => a.sellingPrice - b.sellingPrice
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
      sorter: (a, b) => a.cost - b.cost
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
      sorter: (a, b) => a.profitMargin - b.profitMargin
    },
  ];

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const categoriesData = await getAllCategories();
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch data in parallel
      const [categoriesData, products, salesResponse] = await Promise.all([
        fetchCategories(),
        getAllProducts(),
        axios.get(`${API_BASE_URL}/reports/products`, {
          params: {
            startDate: dayjs(startDate).format('YYYY-MM-DD'),
            endDate: dayjs(endDate).format('YYYY-MM-DD')
          },
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Process the data
      const processedData = products.map(product => {
        const salesData = salesResponse.data.find(item => item.productId === product.id) || {};
        
        const unitsSold = salesData.unitsSold || 0;
        const costPrice = product.cost_price || 0;
        const sellingPrice = product.price || 0;
        const revenue = unitsSold * sellingPrice;
        const cost = unitsSold * costPrice;
        const profit = revenue - cost;
        const profitMargin = (revenue > 0) ? (profit / revenue) * 100 : 0;

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
      calculateSummary(processedData);
      updateCategoryFilters(processedData);
      
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      
      let errorMessage = 'Failed to fetch product performance data';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
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
    columns[2].filters = uniqueCategories.map(category => ({
      text: category,
      value: category
    }));
  };

  // Export report
  const exportReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_BASE_URL}/reports/export`,
        {
          reportType: 'PRODUCT_PERFORMANCE',
          startDate: dayjs(startDate).format('YYYY-MM-DD'),
          endDate: dayjs(endDate).format('YYYY-MM-DD'),
          format: 'PDF'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
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
      console.error('Export error:', error);
      message.error(`Export failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProductReport();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Performance Report</h1>
        <div className="flex gap-4">
          <Button 
            icon={<Download size={16} />} 
            onClick={exportReport}
            loading={exportLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
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
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Generate Report
          </Button>
        </div>
      </Card>
      
      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Products" 
              value={summaryData.totalProducts} 
              valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Revenue" 
              value={formatCurrency(summaryData.totalRevenue)} 
              valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Profit" 
              value={formatCurrency(summaryData.totalProfit)} 
              valueStyle={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: summaryData.totalProfit >= 0 ? '#16a34a' : '#dc2626' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Avg Profit Margin" 
              value={formatPercentage(summaryData.avgProfitMargin)} 
              valueStyle={{ 
                fontSize: '20px', 
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
          scroll={{ x: 1800 }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} products`
          }}
        />
      </Card>
    </div>
  );
};

export default ProductPerformanceReport;