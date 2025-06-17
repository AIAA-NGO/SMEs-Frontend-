import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Select, 
  Table, 
  message, 
  Card, 
  Row, 
  Col, 
  InputNumber, 
  DatePicker,
  Space,
  Typography,
  Divider,
  Statistic,
  Modal,
  Steps,
  Tag,
  Progress,
  Badge,
  Avatar,
  ConfigProvider,
  App,
  version as antdVersion
} from 'antd';
import { createPurchase } from '../../services/purchaseService';
import { getSuppliers } from '../../services/supplierService';
import { getAllProducts } from '../../services/productServices';
import { 
  PlusOutlined, 
  MinusOutlined, 
  ArrowLeftOutlined,
  ShopOutlined,
  EyeOutlined
} from '@ant-design/icons';

console.log(`Using Ant Design version: ${antdVersion}`);

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const CreatePurchase = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      message.error('Failed to fetch suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const handleAddItem = () => {
    setItems([...items, { 
      id: Date.now(),
      productId: null, 
      quantity: 1, 
      unitPrice: 0 
    }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = 
        (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const taxRate = form.getFieldValue('taxRate') || 0;
    const discount = form.getFieldValue('discount') || 0;
    
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal + taxAmount - discountAmount;
    
    return { subtotal, taxAmount, discountAmount, total };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (items.length === 0) {
        message.error('Please add at least one item');
        return;
      }
      
      const purchaseData = {
        supplierId: values.supplierId,
        orderDate: values.orderDate.format('YYYY-MM-DDTHH:mm:ss'),
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRate: values.taxRate || 0,
        discount: values.discount || 0,
        taxAmount: calculateTotals().taxAmount,
        discountAmount: calculateTotals().discountAmount,
        totalAmount: calculateTotals().total,
      };
      
      setLoading(true);
      await createPurchase(purchaseData);
      message.success('Purchase order created successfully');
      navigate('/purchases');
    } catch (error) {
      message.error(error.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      render: (value, record, index) => (
        <Select
          placeholder="Select product"
          value={value}
          className="w-full"
          onChange={(val) => handleItemChange(index, 'productId', val)}
          showSearch
          optionFilterProp="children"
          dropdownMatchSelectWidth={false}
        >
          {products.map(product => (
            <Option key={product.id} value={product.id}>
              <Space>
                <Avatar 
                  src={product.image} 
                  size="small"
                  className="bg-gray-100 text-green-600"
                >
                  {product.name.charAt(0)}
                </Avatar>
                <span>
                  {isMobile ? product.name.substring(0, 15) + (product.name.length > 15 ? '...' : '') : product.name}
                  {!isMobile && (
                    <Text type="secondary" className="text-xs ml-2">
                      {product.sku || 'N/A'}
                    </Text>
                  )}
                </span>
              </Space>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      render: (value, record, index) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleItemChange(index, 'quantity', val)}
          className="w-full"
        />
      ),
    },
    {
      title: isMobile ? 'Price' : 'Unit Price',
      dataIndex: 'unitPrice',
      render: (value, record, index) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => handleItemChange(index, 'unitPrice', val)}
          className="w-full"
          formatter={value => `KSh ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/KSh\s?|(,*)/g, '')}
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      render: (value) => (
        <Text strong className="text-green-600">
          {value ? formatCurrency(value) : 'KSh 0'}
        </Text>
      ),
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, record, index) => (
        <Button
          danger
          type="text"
          icon={<MinusOutlined />}
          onClick={() => handleRemoveItem(index)}
          className="text-gray-600 hover:text-red-500"
        />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#10B981',
          borderRadius: 4,
          colorBgContainer: '#fff',
        },
        components: {
          Button: {
            colorPrimary: '#10B981',
            algorithm: true,
          },
          Table: {
            cellPaddingBlock: 8,
            cellPaddingInline: 8,
          },
        },
      }}
    >
      <App>
        <div className="bg-gray-50 min-h-screen p-4">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/purchases')}
                className="text-gray-800 hover:text-green-600 px-0"
              >
                Back to Purchases
              </Button>
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                onClick={() => navigate('/purchases/track')}
                className="bg-green-600 hover:bg-green-700 border-green-600"
              >
                View Track Page
              </Button>
            </div>
            
            <Card className="w-full shadow-sm bg-white" bodyStyle={{ padding: isMobile ? 16 : 24 }}>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <ShopOutlined className="text-green-600 text-xl" />
                <Title level={3} className="m-0 text-gray-800">
                  New Purchase Order
                </Title>
              </div>
              <Text type="secondary" className="block mb-4">
                Fill in the supplier details and items to create a new purchase order
              </Text>
              
              <Divider className="my-4 border-gray-200" />
              
              <Form form={form} layout="vertical">
                <Card 
                  className="w-full mb-4 bg-gray-50 border-0 border-l-4 border-green-600"
                  bodyStyle={{ padding: isMobile ? 12 : 16 }}
                >
                  <Row gutter={[8, 8]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="supplierId"
                        label={<Text strong className="text-gray-800">Supplier</Text>}
                        rules={[{ required: true, message: 'Please select a supplier' }]}
                      >
                        <Select 
                          placeholder="Select supplier" 
                          showSearch 
                          optionFilterProp="children"
                          size={isMobile ? 'middle' : 'large'}
                          className="w-full"
                        >
                          {suppliers.map(supplier => (
                            <Option key={supplier.id} value={supplier.id}>
                              <Space>
                                <Avatar 
                                  src={supplier.logo} 
                                  size="small"
                                  className="bg-gray-100 text-green-600"
                                >
                                  {supplier.companyName.charAt(0)}
                                </Avatar>
                                <span>{supplier.companyName}</span>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="orderDate"
                        label={<Text strong className="text-gray-800">Order Date</Text>}
                        rules={[{ required: true, message: 'Please select order date' }]}
                      >
                        <DatePicker 
                          showTime 
                          format="YYYY-MM-DD HH:mm" 
                          className="w-full" 
                          size={isMobile ? 'middle' : 'large'}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card 
                  title={<Text strong className="text-gray-800">Order Items</Text>} 
                  className="w-full mb-4"
                  bodyStyle={{ padding: isMobile ? 0 : 16 }}
                  extra={
                    <Button
                      type="primary"
                      onClick={handleAddItem}
                      icon={<PlusOutlined />}
                      size={isMobile ? 'middle' : 'large'}
                      className="bg-green-600 hover:bg-green-700 border-green-600"
                    >
                      {isMobile ? 'Add' : 'Add Item'}
                    </Button>
                  }
                >
                  <Table
                    dataSource={items}
                    rowKey={(record) => record.id}
                    pagination={false}
                    scroll={{ x: true }}
                    columns={columns}
                    locale={{
                      emptyText: (
                        <div className="p-4 text-center">
                          <Text type="secondary">No items added yet. Click "Add Item" to start.</Text>
                        </div>
                      )
                    }}
                    className="responsive-table"
                    size={isMobile ? 'middle' : 'default'}
                  />
                </Card>

                <Row gutter={[8, 8]}>
                  <Col xs={24} md={12}>
                    <Card 
                      title={<Text strong className="text-gray-800">Order Adjustments</Text>} 
                      className="w-full mb-2 md:mb-0"
                      bodyStyle={{ padding: isMobile ? 12 : 16 }}
                    >
                      <Row gutter={8}>
                        <Col xs={24} sm={12}>
                          <Form.Item 
                            name="taxRate" 
                            label={<Text strong>Tax Rate (%)</Text>}
                            initialValue={16}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              className="w-full" 
                              size={isMobile ? 'middle' : 'large'}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item 
                            name="discount" 
                            label={<Text strong>Discount (%)</Text>}
                            initialValue={0}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              className="w-full" 
                              size={isMobile ? 'middle' : 'large'}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card 
                      title={<Text strong className="text-gray-800">Order Summary</Text>} 
                      className="w-full"
                      bodyStyle={{ padding: isMobile ? 12 : 16 }}
                    >
                      <Space direction="vertical" className="w-full">
                        <Row justify="space-between">
                          <Col><Text>Subtotal:</Text></Col>
                          <Col><Text>{formatCurrency(subtotal)}</Text></Col>
                        </Row>
                        <Row justify="space-between">
                          <Col><Text>Tax ({form.getFieldValue('taxRate') || 0}%):</Text></Col>
                          <Col><Text>{formatCurrency(taxAmount)}</Text></Col>
                        </Row>
                        <Row justify="space-between">
                          <Col><Text>Discount ({form.getFieldValue('discount') || 0}%):</Text></Col>
                          <Col><Text>-{formatCurrency(discountAmount)}</Text></Col>
                        </Row>
                        <Divider className="my-2 border-gray-200" />
                        <Row justify="space-between">
                          <Col><Text strong className="text-base">Total Amount:</Text></Col>
                          <Col>
                            <Statistic 
                              value={total} 
                              prefix="KSh" 
                              valueStyle={{ 
                                fontSize: isMobile ? '16px' : '20px',
                                fontWeight: 'bold',
                                color: '#10B981'
                              }}
                              precision={0}
                            />
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <div className="mt-6 text-right">
                  <Space>
                    <Button 
                      size={isMobile ? 'middle' : 'large'}
                      onClick={() => navigate('/purchases')}
                      className="w-24 md:w-32"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      size={isMobile ? 'middle' : 'large'}
                      onClick={handleSubmit} 
                      loading={loading}
                      className="w-32 md:w-40 bg-green-600 hover:bg-green-700 border-green-600"
                    >
                      Submit Order
                    </Button>
                  </Space>
                </div>
              </Form>
            </Card>
          </div>
        </div>

        <style jsx global>{`
          @media (max-width: 767px) {
            .ant-table-thead > tr > th,
            .ant-table-tbody > tr > td {
              padding: 8px !important;
            }
            
            .ant-table-cell {
              font-size: 12px;
            }
            
            .ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
              height: 32px;
            }
            
            .ant-input-number-input {
              height: 32px;
            }
            
            .ant-card-head-title {
              padding: 8px 0;
            }
            
            .ant-card-body {
              padding: 12px;
            }
          }
          
          .responsive-table .ant-table-container {
            overflow-x: auto;
          }
        `}</style>
      </App>
    </ConfigProvider>
  );
};

export default CreatePurchase;