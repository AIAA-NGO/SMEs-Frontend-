import { useState, useEffect } from 'react';
import { Table, Button, Statistic, Tag, message } from 'antd';
import { Download } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const InventoryValuationReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const columns = [
    { 
      title: 'SKU', 
      dataIndex: 'sku', 
      key: 'sku',
      width: 120,
      fixed: 'left' 
    },
    { title: 'Product Name', dataIndex: 'productName', key: 'productName' },
    { 
      title: 'Category', 
      dataIndex: 'categoryName', 
      key: 'category',
      width: 150 
    },
    { 
      title: 'Current Stock', 
      dataIndex: 'currentStock', 
      key: 'quantity',
      width: 120,
      render: (val) => <span className="font-medium">{val}</span>
    },
    { 
      title: 'Unit Cost (KSH)', 
      dataIndex: 'unitCost', 
      key: 'unitCost', 
      render: val => `KSH ${val?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      width: 150
    },
    { 
      title: 'Total Value (KSH)', 
      dataIndex: 'totalValue', 
      key: 'totalValue', 
      render: val => `KSH ${val?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      width: 170
    },
    { 
      title: 'Status', 
      dataIndex: 'stockStatus', 
      key: 'status',
      width: 120,
      render: status => {
        let color = 'green';
        if (status === 'LOW') color = 'red';
        else if (status === 'MEDIUM') color = 'orange';
        return <Tag color={color} className="font-medium">{status}</Tag>;
      }
    },
  ];

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory report: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result.map(item => ({
        ...item,
        totalValue: item.unitCost * item.currentStock,
        stockStatus: getStockStatus(item.currentStock, item.reorderLevel)
      })));
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      message.error('Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (currentStock, reorderLevel) => {
    if (currentStock <= reorderLevel * 0.5) return 'LOW';
    if (currentStock <= reorderLevel * 1.5) return 'MEDIUM';
    return 'HIGH';
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: 'INVENTORY',
          format: 'CSV'
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      message.success('Export started successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  // Calculate total inventory value
  const totalValue = data.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Inventory Valuation Report</h1>
        <Button 
          type="primary" 
          icon={<Download size={16} />} 
          onClick={handleExport}
          loading={exportLoading}
          className="bg-blue-600 hover:bg-blue-700 border-blue-600"
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
        >
          Export
        </Button>
      </div>
      
      <div className="mb-6">
        <Statistic 
          title="Total Inventory Value" 
          value={`KSH ${totalValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          className="text-2xl"
          valueStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
        />
      </div>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        rowKey="sku"
        scroll={{ x: 1000 }}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} items`
        }}
      />
    </div>
  );
};

export default InventoryValuationReport;