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
      navigate('/purchases'); // Changed from navigating to track page to just going back to purchases list
    } catch (error) {
      message.error(error.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#800000',
          borderRadius: 4,
          colorBgContainer: '#fff',
        },
        components: {
          Button: {
            colorPrimary: '#800000',
            algorithm: true,
          },
        },
      }}
    >
      <App>
        <div className="create-purchase" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f5f5f5' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/purchases')}
                style={{ color: '#800000' }}
              >
                Back to Purchases
              </Button>
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                onClick={() => navigate('/purchases/track')}
                style={{ 
                  backgroundColor: '#800000',
                  borderColor: '#800000',
                  borderRadius: '4px'
                }}
              >
                View Track Page
              </Button>
            </div>
            
            <Card variant="borderless" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
              <Title level={3} style={{ marginBottom: 8, color: '#800000' }}>
                <ShopOutlined style={{ marginRight: 8 }} />
                New Purchase Order
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Fill in the supplier details and items to create a new purchase order
              </Text>
              
              <Divider style={{ margin: '16px 0', borderColor: '#f0f0f0' }} />
              
              <Form form={form} layout="vertical">
                <Card 
                  variant="borderless" 
                  style={{ 
                    backgroundColor: '#fafafa',
                    borderLeft: '4px solid #800000',
                    marginBottom: '24px'
                  }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="supplierId"
                        label={<Text strong style={{ color: '#800000' }}>Supplier</Text>}
                        rules={[{ required: true, message: 'Please select a supplier' }]}
                      >
                        <Select 
                          placeholder="Select supplier" 
                          showSearch 
                          optionFilterProp="children"
                          size="large"
                          style={{ borderRadius: '4px' }}
                        >
                          {suppliers.map(supplier => (
                            <Option key={supplier.id} value={supplier.id}>
                              <Space>
                                <Avatar 
                                  src={supplier.logo} 
                                  size="small"
                                  style={{ backgroundColor: '#f5f5f5', color: '#800000' }}
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
                    <Col span={12}>
                      <Form.Item
                        name="orderDate"
                        label={<Text strong style={{ color: '#800000' }}>Order Date</Text>}
                        rules={[{ required: true, message: 'Please select order date' }]}
                      >
                        <DatePicker 
                          showTime 
                          format="YYYY-MM-DD HH:mm" 
                          style={{ width: '100%' }} 
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card 
                  title={<Text strong style={{ color: '#800000' }}>Order Items</Text>} 
                  variant="borderless"
                  style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', marginBottom: '24px', backgroundColor: '#fff' }}
                  extra={
                    <Button
                      type="primary"
                      onClick={handleAddItem}
                      icon={<PlusOutlined />}
                      style={{ 
                        backgroundColor: '#800000',
                        borderColor: '#800000',
                        borderRadius: '4px'
                      }}
                    >
                      Add Item
                    </Button>
                  }
                >
                  <Table
                    dataSource={items}
                    rowKey={(record) => record.id}
                    pagination={false}
                    columns={[
                      {
                        title: 'Product',
                        dataIndex: 'productId',
                        width: '35%',
                        render: (value, record, index) => (
                          <Select
                            placeholder="Select product"
                            value={value}
                            style={{ width: '100%', borderRadius: '4px' }}
                            onChange={(val) => handleItemChange(index, 'productId', val)}
                            showSearch
                            optionFilterProp="children"
                          >
                            {products.map(product => (
                              <Option key={product.id} value={product.id}>
                                <Space>
                                  <Avatar 
                                    src={product.image} 
                                    size="small"
                                    style={{ backgroundColor: '#f5f5f5', color: '#800000' }}
                                  >
                                    {product.name.charAt(0)}
                                  </Avatar>
                                  <span>
                                    {product.name} 
                                    <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                                      {product.sku || 'N/A'}
                                    </Text>
                                  </span>
                                </Space>
                              </Option>
                            ))}
                          </Select>
                        ),
                      },
                      {
                        title: 'Quantity',
                        dataIndex: 'quantity',
                        width: '15%',
                        render: (value, record, index) => (
                          <InputNumber
                            min={1}
                            value={value}
                            onChange={(val) => handleItemChange(index, 'quantity', val)}
                            style={{ width: '100%', borderRadius: '4px' }}
                          />
                        ),
                      },
                      {
                        title: 'Unit Price',
                        dataIndex: 'unitPrice',
                        width: '15%',
                        render: (value, record, index) => (
                          <InputNumber
                            min={0}
                            value={value}
                            onChange={(val) => handleItemChange(index, 'unitPrice', val)}
                            style={{ width: '100%', borderRadius: '4px' }}
                            formatter={value => `KSh ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/KSh\s?|(,*)/g, '')}
                          />
                        ),
                      },
                      {
                        title: 'Total',
                        dataIndex: 'totalPrice',
                        width: '15%',
                        render: (value) => (
                          <Text strong style={{ color: '#800000' }}>
                            {value ? formatCurrency(value) : 'KSh 0'}
                          </Text>
                        ),
                      },
                      {
                        title: 'Action',
                        width: '10%',
                        align: 'center',
                        render: (_, record, index) => (
                          <Button
                            danger
                            type="text"
                            icon={<MinusOutlined />}
                            onClick={() => handleRemoveItem(index)}
                            style={{ fontSize: '16px', color: '#800000' }}
                          />
                        ),
                      },
                    ]}
                    locale={{
                      emptyText: (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                          <Text type="secondary">No items added yet. Click "Add Item" to start.</Text>
                        </div>
                      )
                    }}
                    style={{ backgroundColor: '#fff' }}
                  />
                </Card>

                <Row gutter={24}>
                  <Col span={12}>
                    <Card 
                      title={<Text strong style={{ color: '#800000' }}>Order Adjustments</Text>} 
                      variant="borderless"
                      style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', backgroundColor: '#fff' }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            name="taxRate" 
                            label={<Text strong>Tax Rate (%)</Text>}
                            initialValue={16}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              style={{ width: '100%', borderRadius: '4px' }} 
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            name="discount" 
                            label={<Text strong>Discount (%)</Text>}
                            initialValue={0}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              style={{ width: '100%', borderRadius: '4px' }} 
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card 
                      title={<Text strong style={{ color: '#800000' }}>Order Summary</Text>} 
                      variant="borderless"
                      style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', backgroundColor: '#fff' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
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
                        <Divider style={{ margin: '12px 0', borderColor: '#f0f0f0' }} />
                        <Row justify="space-between">
                          <Col><Text strong style={{ fontSize: '16px' }}>Total Amount:</Text></Col>
                          <Col>
                            <Statistic 
                              value={total} 
                              prefix="KSh" 
                              valueStyle={{ 
                                fontSize: '20px', 
                                fontWeight: 'bold',
                                color: '#800000'
                              }}
                              precision={0}
                            />
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginTop: '32px', textAlign: 'right' }}>
                  <Space>
                    <Button 
                      size="large" 
                      onClick={() => navigate('/purchases')}
                      style={{ width: '150px', borderRadius: '4px' }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      size="large" 
                      onClick={handleSubmit} 
                      loading={loading}
                      style={{ 
                        width: '200px',
                        backgroundColor: '#800000',
                        borderColor: '#800000',
                        borderRadius: '4px'
                      }}
                    >
                      Submit Order
                    </Button>
                  </Space>
                </div>
              </Form>
            </Card>
          </Space>
        </div>
      </App>
    </ConfigProvider>
  );
};

export default CreatePurchase;