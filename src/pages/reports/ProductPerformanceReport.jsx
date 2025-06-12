import { useState } from 'react';
import { DatePicker, Table, Button, Statistic, message, Card } from 'antd';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const ProductPerformanceReport = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const formatCurrency = (value) => {
    return `KSH ${value?.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const columns = [
    { 
      title: 'Product ID', 
      dataIndex: 'productId', 
      key: 'productId',
      width: 120,
      fixed: 'left'
    },
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      width: 200
    },
    { 
      title: 'Category', 
      dataIndex: 'category', 
      key: 'category',
      width: 150
    },
    { 
      title: 'Units Sold', 
      dataIndex: 'unitsSold', 
      key: 'unitsSold',
      render: units => <span className="font-medium">{units}</span>,
      width: 120
    },
    { 
      title: 'Revenue (KSH)', 
      dataIndex: 'revenue', 
      key: 'revenue',
      render: val => <span className="text-green-600 font-medium">{formatCurrency(val)}</span>,
      width: 170
    },
    { 
      title: 'Profit (KSH)', 
      dataIndex: 'profit', 
      key: 'profit',
      render: val => (
        <span className={val >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {formatCurrency(val)}
        </span>
      ),
      width: 170
    },
    { 
      title: 'Return Rate', 
      dataIndex: 'returnRate', 
      key: 'returnRate',
      render: val => (
        <span className={val > 5 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
          {val}%
        </span>
      ),
      width: 150
    },
  ];

  const fetchProductReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD')
      };

      const response = await axios.get(`${API_BASE_URL}/reports/products`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setData(response.data);
    } catch (error) {
      console.error('Error fetching product report:', error);
      message.error('Failed to fetch product performance data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
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

      // Create download link
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
      console.error('Error exporting report:', error);
      message.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate summary statistics
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalProfit = data.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Product Performance Report</h1>
        <Button 
          icon={<Download size={16} />} 
          onClick={exportReport}
          loading={exportLoading}
          className="bg-blue-600 text-white"
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
        >
          Export
        </Button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <DatePicker
          placeholder="Start Date"
          value={startDate}
          onChange={setStartDate}
          className="w-40"
          format="YYYY-MM-DD"
        />
        <DatePicker
          placeholder="End Date"
          value={endDate}
          onChange={setEndDate}
          className="w-40"
          format="YYYY-MM-DD"
        />
        <Button 
          type="primary" 
          onClick={fetchProductReport}
          loading={loading}
          className="bg-green-600"
          style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
        >
          Generate Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic 
            title="Total Products" 
            value={data.length} 
            valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
          />
        </Card>
        <Card>
          <Statistic 
            title="Total Revenue" 
            value={formatCurrency(totalRevenue)} 
            valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}
          />
        </Card>
        <Card>
          <Statistic 
            title="Total Profit" 
            value={formatCurrency(totalProfit)} 
            valueStyle={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: totalProfit >= 0 ? '#16a34a' : '#dc2626' 
            }}
          />
        </Card>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        rowKey="productId"
        scroll={{ x: 1200 }}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} products`
        }}
      />
    </div>
  );
};

export default ProductPerformanceReport;