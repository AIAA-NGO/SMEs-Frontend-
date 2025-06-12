import { useState } from 'react';
import { DatePicker, Table, Button, Tag, message, Statistic } from 'antd';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const SupplierPurchasesReport = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const columns = [
    { 
      title: 'Supplier', 
      dataIndex: 'supplierName', 
      key: 'supplierName',
      width: 200,
      fixed: 'left'
    },
    { 
      title: 'Purchase Order', 
      dataIndex: 'poNumber', 
      key: 'poNumber',
      width: 150
    },
    { 
      title: 'Date', 
      dataIndex: 'date', 
      key: 'date',
      render: date => dayjs(date).format('DD/MM/YYYY'),
      width: 120
    },
    { 
      title: 'Product', 
      dataIndex: 'productName', 
      key: 'productName',
      width: 200
    },
    { 
      title: 'Quantity', 
      dataIndex: 'quantity', 
      key: 'quantity',
      render: quantity => <span className="font-medium">{quantity}</span>,
      width: 100
    },
    { 
      title: 'Unit Cost (KSH)', 
      dataIndex: 'unitCost', 
      key: 'unitCost', 
      render: val => formatCurrency(val),
      width: 150
    },
    { 
      title: 'Total Cost (KSH)', 
      dataIndex: 'totalCost', 
      key: 'totalCost', 
      render: val => <span className="font-semibold">{formatCurrency(val)}</span>,
      width: 170
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: status => (
        <Tag 
          color={status === 'PENDING' ? 'orange' : status === 'RECEIVED' ? 'green' : 'blue'}
          className="font-medium"
        >
          {status}
        </Tag>
      )
    },
  ];

  const formatCurrency = (value) => {
    return `KSH ${value?.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const fetchSupplierReport = async () => {
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

      const response = await axios.get(`${API_BASE_URL}/reports/suppliers`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setData(response.data);
    } catch (error) {
      console.error('Error fetching supplier report:', error);
      message.error('Failed to fetch supplier purchases data');
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
          reportType: 'SUPPLIER_PURCHASES',
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
        `supplier-purchases-${dayjs().format('YYYY-MM-DD')}.pdf`
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

  // Calculate total purchases
  const totalPurchases = data.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Supplier Purchases Report</h1>
        <Button 
          icon={<Download size={16} />} 
          onClick={exportReport}
          loading={exportLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
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
          onClick={fetchSupplierReport}
          loading={loading}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          Generate Report
        </Button>
      </div>
      
      <div className="mb-6">
        <Statistic
          title="Total Purchases"
          value={formatCurrency(totalPurchases)}
          valueStyle={{
            color: '#1d4ed8',
            fontSize: '20px',
            fontWeight: 'bold'
          }}
        />
      </div>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        rowKey="poNumber"
        scroll={{ x: 1200 }}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} purchases`
        }}
      />
    </div>
  );
};

export default SupplierPurchasesReport;