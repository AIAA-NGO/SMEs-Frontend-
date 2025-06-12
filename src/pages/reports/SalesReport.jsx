import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Statistic, 
  DatePicker, 
  Button, 
  Select, 
  Input, 
  Modal, 
  Form,
  message,
  Tabs
} from 'antd';
import { 
  DownloadOutlined, 
  PlusOutlined, 
  SearchOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { 
  getSales, 
  getSalesByDateRange, 
  exportSalesToCSV, 
  getDailySummary,
  createSale
} from '../../services/salesService';

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const SalesReport = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dailySummary, setDailySummary] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('day')
  ]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('transactions');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  // Fetch sales data
  const fetchSalesData = async () => {
    setLoading(true);
    try {
      let data;
      if (dateRange[0] && dateRange[1]) {
        data = await getSalesByDateRange(
          dateRange[0].toDate(), 
          dateRange[1].toDate()
        );
      } else {
        data = await getSales();
      }
      setSales(data);
      setFilteredSales(data);
    } catch (error) {
      message.error('Failed to fetch sales data');
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily summary
  const fetchDailySummary = async () => {
    try {
      const summary = await getDailySummary(new Date());
      setDailySummary(summary);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      message.error('Failed to load daily summary');
    }
  };

  // Handle search
  const handleSearch = () => {
    let result = [...sales];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(sale => 
        (sale.customerName && sale.customerName.toLowerCase().includes(term)) ||
        (sale.id && sale.id.toString().includes(term))
      );
    }
    
    if (statusFilter) {
      result = result.filter(sale => sale.status === statusFilter);
    }
    
    setFilteredSales(result);
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      await exportSalesToCSV(filteredSales);
      message.success('Export started successfully');
    } catch (error) {
      message.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const saleData = {
        customerId: values.customerId,
        paymentMethod: values.paymentMethod,
        items: values.items.map(itemId => ({ productId: itemId, quantity: 1 })),
        discount: values.discount || 0,
        notes: values.notes || ''
      };
      
      await createSale(saleData);
      message.success('Sale created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchSalesData();
      fetchDailySummary(); // Refresh summary after new sale
    } catch (error) {
      message.error('Failed to create sale');
      console.error('Error creating sale:', error);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    return filteredSales.reduce(
      (acc, sale) => {
        if (sale.status === 'COMPLETED') acc.completed += sale.totalAmount || 0;
        if (sale.status === 'CANCELLED') acc.cancelled += sale.totalAmount || 0;
        acc.all += sale.totalAmount || 0;
        return acc;
      },
      { completed: 0, cancelled: 0, all: 0 }
    );
  };

  const totals = calculateTotals();

  // Columns for transactions table
  const transactionColumns = [
    {
      title: 'Sale ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${id}`
    },
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customer',
      render: (name) => name || 'Walk-in'
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      align: 'right',
      render: (amount) => formatCurrency(amount)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<FileTextOutlined />}
          onClick={() => window.open(`/api/sales/receipt/${record.id}`, '_blank')}
        >
          Receipt
        </Button>
      )
    }
  ];

  // Columns for detailed report
  const reportColumns = [
    {
      title: 'Sale ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${id}`
    },
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY')
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customer',
      render: (name) => name || 'Walk-in'
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      align: 'right',
      render: (amount) => formatCurrency(amount)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    }
  ];

  // Load data on component mount
  useEffect(() => {
    fetchSalesData();
    fetchDailySummary();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    handleSearch();
  }, [searchTerm, statusFilter, sales]);

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchSalesData();
    }
  }, [dateRange]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Management</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Sale
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-full md:w-auto"
          onOk={fetchSalesData}
        />
        
        <Input
          placeholder="Search by customer or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64"
          allowClear
        />
        
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full md:w-48"
          allowClear
        >
          <Option value="COMPLETED">Completed</Option>
          <Option value="PENDING">Pending</Option>
          <Option value="CANCELLED">Cancelled</Option>
        </Select>
        
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={fetchSalesData}
        >
          Search
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic
            title="Total Sales"
            value={formatCurrency(totals.all)}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Today's Sales"
            value={dailySummary ? formatCurrency(dailySummary.totalSales) : 'Loading...'}
          />
        </Card>
        <Card>
          <Statistic
            title="Transactions"
            value={filteredSales.length}
          />
        </Card>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <FileTextOutlined /> Transactions
            </span>
          }
          key="transactions"
        >
          <Table
            columns={transactionColumns}
            dataSource={filteredSales}
            loading={loading}
            rowKey="id"
            scroll={{ x: true }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <BarChartOutlined /> Sales Report
            </span>
          }
          key="report"
        >
          <div className="flex justify-end mb-4">
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Export Report
            </Button>
          </div>
          
          <Table
            columns={reportColumns}
            dataSource={filteredSales}
            loading={loading}
            rowKey="id"
            scroll={{ x: true }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
          />
        </TabPane>
      </Tabs>

      {/* New Sale Modal */}
      <Modal
        title="Create New Sale"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Customer"
              name="customerId"
              rules={[{ required: true, message: 'Please select a customer' }]}
            >
              <Select placeholder="Select customer">
                <Option value={1}>John Doe</Option>
                <Option value={2}>Jane Smith</Option>
                <Option value={3}>Walk-in Customer</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Payment Method"
              name="paymentMethod"
              rules={[{ required: true, message: 'Please select payment method' }]}
            >
              <Select placeholder="Select payment method">
                <Option value="CASH">Cash</Option>
                <Option value="MPESA">M-Pesa</Option>
                <Option value="CARD">Credit Card</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Items"
              name="items"
              rules={[{ required: true, message: 'Please add at least one item' }]}
            >
              <Select mode="multiple" placeholder="Select items">
                <Option value={1}>Product 1</Option>
                <Option value={2}>Product 2</Option>
                <Option value={3}>Product 3</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Discount (%)"
              name="discount"
            >
              <Input type="number" min={0} max={100} />
            </Form.Item>

            <Form.Item
              label="Notes"
              name="notes"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Sale
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesReport;