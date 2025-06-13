import { useState, useEffect } from 'react';
import { Table, Button, Statistic, Tag, message, Card, Row, Col } from 'antd';
import { Download } from 'lucide-react';
import { InventoryService } from '../../services/InventoryService';
import { getAllProducts } from '../../services/productServices';
import { getAllCategories } from '../../services/categories'; // Import categories service

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const InventoryValuationReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [categories, setCategories] = useState([]); // State for categories
  const [summaryData, setSummaryData] = useState({
    totalValue: 0,
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

  const columns = [
    { 
      title: 'SKU', 
      dataIndex: 'sku', 
      key: 'sku',
      width: 120,
      fixed: 'left',
      sorter: (a, b) => a.sku?.localeCompare(b.sku || '')
    },
    { 
      title: 'Product Name', 
      dataIndex: 'name', 
      key: 'name',
      sorter: (a, b) => a.name?.localeCompare(b.name || '')
    },
    { 
      title: 'Category', 
      dataIndex: 'categoryName', 
      key: 'category',
      width: 150,
      filters: [],
      onFilter: (value, record) => record.categoryName === value,
      sorter: (a, b) => a.categoryName?.localeCompare(b.categoryName || '')
    },
    { 
      title: 'Current Stock', 
      dataIndex: 'currentStock', 
      key: 'quantity',
      width: 120,
      render: (val) => <span className="font-medium">{val || 0}</span>,
      sorter: (a, b) => (a.currentStock || 0) - (b.currentStock || 0)
    },
    { 
      title: 'Unit Cost (KSH)', 
      dataIndex: 'cost_price', 
      key: 'unitCost', 
      render: val => `KSH ${(val || 0)?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      width: 150,
      sorter: (a, b) => (a.cost_price || 0) - (b.cost_price || 0)
    },
    { 
      title: 'Total Value (KSH)', 
      dataIndex: 'totalValue', 
      key: 'totalValue', 
      render: val => `KSH ${(val || 0)?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      width: 170,
      sorter: (a, b) => (a.totalValue || 0) - (b.totalValue || 0)
    },
    { 
      title: 'Reorder Level', 
      dataIndex: 'low_stock_threshold', 
      key: 'reorderLevel',
      width: 120,
      render: val => <span className="font-medium">{val || 0}</span>
    },
    { 
      title: 'Status', 
      dataIndex: 'stockStatus', 
      key: 'status',
      width: 120,
      render: status => {
        let color = 'green';
        if (status === 'OUT OF STOCK') color = 'red';
        else if (status === 'LOW') color = 'orange';
        else if (status === 'MEDIUM') color = 'blue';
        return <Tag color={color} className="font-medium">{status || 'N/A'}</Tag>;
      },
      filters: [
        { text: 'HIGH', value: 'HIGH' },
        { text: 'MEDIUM', value: 'MEDIUM' },
        { text: 'LOW', value: 'LOW' },
        { text: 'OUT OF STOCK', value: 'OUT OF STOCK' },
      ],
      onFilter: (value, record) => record.stockStatus === value,
    },
  ];

  const fetchCategories = async () => {
    try {
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
      return categoriesData; // Return categories data for use in fetchInventoryReport
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
      return []; // Return empty array if there's an error
    }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      // Fetch categories first and wait for completion
      const categoriesData = await fetchCategories();

      // Then fetch products
      const products = await getAllProducts();
      console.log('Fetched products:', products);

      if (!products || products.length === 0) {
        message.warning('No products found');
        setData([]);
        return;
      }

      // Then fetch inventory status
      const inventoryStatus = await InventoryService.getInventoryStatus();
      console.log('Fetched inventory status:', inventoryStatus);

      // Process the data to include calculated fields
      const processedData = products.map(product => {
        const inventoryItem = Array.isArray(inventoryStatus) 
          ? inventoryStatus.find(item => item.productId === product.id) || {}
          : {};

        const currentStock = inventoryItem.quantity || product.quantity_in_stock || 0;
        const reorderLevel = product.low_stock_threshold || 0;
        const unitCost = product.cost_price || 0;
        const totalValue = unitCost * currentStock;
        const stockStatus = getStockStatus(currentStock, reorderLevel);
        
        // Find category name from fetched categories data
        const productCategory = categoriesData.find(cat => cat.id === product.category_id);
        const categoryName = productCategory?.name || product.category?.name || 'Uncategorized';
        
        return {
          ...product,
          ...inventoryItem,
          id: product.id,
          currentStock,
          totalValue,
          stockStatus,
          categoryName,
          reorderLevel
        };
      });

      console.log('Processed data:', processedData);
      setData(processedData);
      
      // Calculate summary statistics
      calculateSummary(processedData);
      
      // Update category filters
      updateCategoryFilters(processedData);
      
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      message.error(`Failed to load inventory report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (currentStock, reorderLevel) => {
    if (currentStock === 0) return 'OUT OF STOCK';
    if (currentStock <= reorderLevel * 0.5) return 'LOW';
    if (currentStock <= reorderLevel) return 'MEDIUM';
    return 'HIGH';
  };

  const calculateSummary = (inventoryData) => {
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const lowStockItems = inventoryData.filter(item => 
      item.stockStatus === 'LOW' || item.stockStatus === 'MEDIUM'
    ).length;
    const outOfStockItems = inventoryData.filter(item => 
      item.stockStatus === 'OUT OF STOCK'
    ).length;

    setSummaryData({
      totalValue,
      totalItems: inventoryData.length,
      lowStockItems,
      outOfStockItems
    });
  };

  const updateCategoryFilters = (inventoryData) => {
    const uniqueCategories = [...new Set(inventoryData.map(item => item.categoryName))];
    columns[2].filters = uniqueCategories.map(category => ({
      text: category,
      value: category
    }));
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
          format: 'CSV',
          data: data.map(item => ({
            sku: item.sku,
            name: item.name,
            category: item.categoryName,
            currentStock: item.currentStock,
            unitCost: item.cost_price,
            totalValue: item.totalValue,
            reorderLevel: item.low_stock_threshold,
            status: item.stockStatus
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      message.success('Export started successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error(`Failed to export report: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Valuation Report</h1>
        <Button 
          type="primary" 
          icon={<Download size={16} />} 
          onClick={handleExport}
          loading={exportLoading}
          className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
        >
          Export Report
        </Button>
      </div>
      
      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Inventory Value" 
              value={`KSH ${summaryData.totalValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#1d4ed8' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Items" 
              value={summaryData.totalItems}
              valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Low/Medium Stock" 
              value={summaryData.lowStockItems}
              valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#ea580c' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Out of Stock" 
              value={summaryData.outOfStockItems}
              valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Inventory Table */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} inventory items`
          }}
        />
      </Card>
    </div>
  );
};

export default InventoryValuationReport;