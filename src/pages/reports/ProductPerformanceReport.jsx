import { useState, useEffect, useMemo } from 'react';
import { DatePicker, Table, Button, Statistic, message, Card, Row, Col, Spin, Tag } from 'antd';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';
import { getAllProducts } from '../../services/productServices';
import { getCategories } from '../../services/productServices';
import { getProfitLossReport } from '../../services/profitService';

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
    totalCosts: 0,
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
    return `${Math.round((value || 0) * 100) / 100}%`;
  };

  // Columns configuration
  const columns = useMemo(() => [
    { 
      title: 'Product ID', 
      dataIndex: 'productId', 
      key: 'productId',
      width: 100,
      fixed: 'left',
      sorter: (a, b) => a.productId - b.productId,
    },
    { 
      title: 'Product Name', 
      dataIndex: 'productName', 
      key: 'productName',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.productName?.localeCompare(b.productName || ''),
    },
    { 
      title: 'Category', 
      dataIndex: 'categoryName', 
      key: 'category',
      width: 150,
      render: (category) => category || <Tag color="default">Uncategorized</Tag>,
      sorter: (a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''),
    },
    { 
      title: 'Cost Price', 
      dataIndex: 'costPrice', 
      key: 'costPrice',
      render: val => <span className="text-gray-600 font-medium">{formatCurrency(val)}</span>,
      width: 120,
      sorter: (a, b) => (a.costPrice || 0) - (b.costPrice || 0),
    },
    { 
      title: 'Selling Price', 
      dataIndex: 'sellingPrice', 
      key: 'sellingPrice',
      render: val => <span className="text-blue-600 font-medium">{formatCurrency(val)}</span>,
      width: 120,
      sorter: (a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0),
    },
    { 
      title: 'Units Sold', 
      dataIndex: 'unitsSold', 
      key: 'unitsSold',
      render: units => <span className="font-medium">{units}</span>,
      width: 100,
      sorter: (a, b) => (a.unitsSold || 0) - (b.unitsSold || 0),
    },
    { 
      title: 'Revenue', 
      dataIndex: 'revenue', 
      key: 'revenue',
      render: val => <span className="text-green-600 font-medium">{formatCurrency(val)}</span>,
      width: 120,
      sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
    },
    { 
      title: 'Cost', 
      dataIndex: 'cost', 
      key: 'cost',
      render: val => <span className="text-red-600 font-medium">{formatCurrency(val)}</span>,
      width: 120,
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
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
      width: 120,
      sorter: (a, b) => (a.profit || 0) - (b.profit || 0),
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
      width: 120,
      sorter: (a, b) => (a.profitMargin || 0) - (b.profitMargin || 0),
    },
  ], []);

  // Fetch product performance report
  const fetchProductReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      // Fetch all necessary data in parallel
      const [categoriesData, products, profitData] = await Promise.all([
        getCategories(),
        getAllProducts(),
        getProfitLossReport(startDate.toDate(), endDate.toDate())
      ]);

      console.log('API Responses:', { categoriesData, products, profitData });

      // Set categories
      setCategories(categoriesData || []);

      // Process the profit data with products
      if (Array.isArray(products)) {
        const productBreakdown = Array.isArray(profitData?.productBreakdown) 
          ? profitData.productBreakdown 
          : [];

        const processedData = products.map(product => {
          const productStats = productBreakdown.find(
            item => item.productId === product.id
          ) || { revenue: 0, cost: 0, quantity: 0 };

          const revenue = Number(productStats.revenue) || 0;
          const cost = Number(productStats.cost) || 0;
          const unitsSold = Number(productStats.quantity) || 0;
          const profit = revenue - cost;
          const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

          // Find category name from categories data
          const productCategory = categoriesData?.find(
            cat => cat.id === (product.categoryId || product.category_id)
          );
          
          const categoryName = productCategory?.name || product.category?.name || null;

          return {
            productId: product.id,
            productName: product.name || `Product ${product.id}`,
            categoryName,
            costPrice: Number(product.costPrice || product.cost_price) || 0,
            sellingPrice: Number(product.price) || 0,
            unitsSold,
            revenue,
            cost,
            profit,
            profitMargin
          };
        });

        setData(processedData);
        calculateSummary(processedData, profitData);
      } else {
        message.error('No product data available');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching product report:', error);
      message.error(error.message || 'Failed to fetch product performance data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateSummary = (reportData, profitData) => {
    const totalRevenue = reportData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalCosts = reportData.reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalProfit = totalRevenue - totalCosts;
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    setSummaryData({
      totalProducts: reportData.length,
      totalRevenue,
      totalCosts,
      totalProfit,
      avgProfitMargin
    });
  };

  // Export report
  const handleExport = async () => {
    if (data.length === 0) {
      message.warning('No data to export');
      return;
    }

    setExportLoading(true);
    try {
      const headers = columns.map(col => col.title).join(',');
      const rows = data.map(item => 
        columns.map(col => {
          const value = item[col.dataIndex];
          if (col.dataIndex === 'profitMargin') return formatPercentage(value);
          if (['costPrice', 'sellingPrice', 'revenue', 'cost', 'profit'].includes(col.dataIndex)) {
            return formatCurrency(value).replace(/[^\d.,-]/g, '');
          }
          return `"${value || ''}"`;
        }).join(',')
      ).join('\n');

      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `product-performance-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

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
            disabled={data.length === 0}
            className="bg-blue-600 text-white hover:bg-blue-700 w-full md:w-auto"
          >
            Export Report
          </Button>
        </div>
      </div>
      
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
      
      <Row gutter={[16, 16]} className="mb-4 md:mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Products" 
              value={summaryData.totalProducts} 
              valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Revenue" 
              value={formatCurrency(summaryData.totalRevenue)} 
              valueStyle={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Costs" 
              value={formatCurrency(summaryData.totalCosts)} 
              valueStyle={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Net Profit" 
              value={formatCurrency(summaryData.totalProfit)} 
              valueStyle={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: summaryData.totalProfit >= 0 ? '#16a34a' : '#dc2626' 
              }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          rowKey="productId"
          scroll={{ x: 1300 }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} products`,
          }}
          size="small"
          locale={{
            emptyText: loading ? <Spin size="large" /> : 'No product data available'
          }}
        />
      </Card>
    </div>
  );
};

export default ProductPerformanceReport;