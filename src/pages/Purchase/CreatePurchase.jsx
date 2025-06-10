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
  Modal
} from 'antd';
import { createPurchase, receivePurchase } from '../../services/purchaseService';
import { getSuppliers } from '../../services/supplierService';
import { getAllProducts } from '../../services/productServices';
import { PlusOutlined, MinusOutlined, ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const CreatePurchase = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [purchaseId, setPurchaseId] = useState(null); // To store the created purchase ID

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
    setItems([...items, { productId: null, quantity: 1, unitPrice: 0 }]);
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
      const createdPurchase = await createPurchase(purchaseData);
      setPurchaseId(createdPurchase.id); // Store the created purchase ID
      message.success('Purchase order created successfully');
    } catch (error) {
      message.error(error.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleReceivePurchase = () => {
    confirm({
      title: 'Confirm Receipt of Purchase Order',
      content: 'Are you sure you want to mark this purchase order as received? This will update your inventory.',
      okText: 'Yes, Receive',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setIsReceiving(true);
          await receivePurchase(purchaseId);
          message.success('Purchase order marked as received successfully');
          navigate('/purchases');
        } catch (error) {
          message.error(error.message || 'Failed to receive purchase order');
        } finally {
          setIsReceiving(false);
        }
      }
    });
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  return (
    <div className="create-purchase" style={{ padding: '24px' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/purchases')}
          style={{ marginBottom: '16px' }}
        >
          Back to Purchases
        </Button>
        
        <Title level={3} style={{ marginBottom: 0 }}>Create New Purchase Order</Title>
        <Text type="secondary">Fill in the details below to create a new purchase order</Text>
        
        <Divider />
        
        <Form form={form} layout="vertical">
          <Card bordered={false}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="supplierId"
                  label={<Text strong>Supplier</Text>}
                  rules={[{ required: true, message: 'Please select a supplier' }]}
                >
                  <Select 
                    placeholder="Select supplier" 
                    showSearch 
                    optionFilterProp="children"
                    size="large"
                  >
                    {suppliers.map(supplier => (
                      <Option key={supplier.id} value={supplier.id}>
                        {supplier.companyName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="orderDate"
                  label={<Text strong>Order Date</Text>}
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
            title={<Text strong>Purchase Items</Text>} 
            bordered={false}
            extra={
              <Button
                type="primary"
                onClick={handleAddItem}
                icon={<PlusOutlined />}
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
              >
                Add Item
              </Button>
            }
          >
            <Table
              dataSource={items}
              rowKey={(record, index) => index}
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
                      style={{ width: '100%' }}
                      onChange={(val) => handleItemChange(index, 'productId', val)}
                      showSearch
                      optionFilterProp="children"
                    >
                      {products.map(product => (
                        <Option key={product.id} value={product.id}>
                          {product.name} ({product.sku || 'N/A'})
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
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Unit Price (KSh)',
                  dataIndex: 'unitPrice',
                  width: '15%',
                  render: (value, record, index) => (
                    <InputNumber
                      min={0}
                      value={value}
                      onChange={(val) => handleItemChange(index, 'unitPrice', val)}
                      style={{ width: '100%' }}
                      formatter={value => `KSh ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/KSh\s?|(,*)/g, '')}
                    />
                  ),
                },
                {
                  title: 'Total (KSh)',
                  dataIndex: 'totalPrice',
                  width: '15%',
                  render: (value) => (
                    <Text strong>{value ? formatCurrency(value) : 'KSh 0'}</Text>
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
                      style={{ fontSize: '16px' }}
                    />
                  ),
                },
              ]}
              locale={{
                emptyText: (
                  <div style={{ padding: '16px' }}>
                    <Text type="secondary">No items added yet</Text>
                  </div>
                )
              }}
            />
          </Card>

          <Row gutter={24}>
            <Col span={12}>
              <Card title={<Text strong>Adjustments</Text>} bordered={false}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="taxRate" label={<Text strong>Tax Rate (%)</Text>}>
                      <InputNumber 
                        min={0} 
                        max={100} 
                        style={{ width: '100%' }} 
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="discount" label={<Text strong>Discount (%)</Text>}>
                      <InputNumber 
                        min={0} 
                        max={100} 
                        style={{ width: '100%' }} 
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<Text strong>Order Summary</Text>} bordered={false}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row justify="space-between">
                    <Col><Text>Subtotal:</Text></Col>
                    <Col><Text>{formatCurrency(subtotal)}</Text></Col>
                  </Row>
                  <Row justify="space-between">
                    <Col><Text>Tax:</Text></Col>
                    <Col><Text>{formatCurrency(taxAmount)}</Text></Col>
                  </Row>
                  <Row justify="space-between">
                    <Col><Text>Discount:</Text></Col>
                    <Col><Text>-{formatCurrency(discountAmount)}</Text></Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <Row justify="space-between">
                    <Col><Text strong>Total:</Text></Col>
                    <Col>
                      <Statistic 
                        value={total} 
                        prefix="KSh" 
                        valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                        precision={0}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card bordered={false} style={{ marginTop: '16px' }}>
            <Space>
              <Button 
                type="primary" 
                size="large" 
                onClick={handleSubmit} 
                loading={loading}
                style={{ 
                  width: '200px',
                  backgroundColor: '#722ed1',
                  borderColor: '#722ed1',
                }}
              >
                Submit Purchase Order
              </Button>
              
              {purchaseId && (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<CheckOutlined />}
                  onClick={handleReceivePurchase}
                  loading={isReceiving}
                  style={{ 
                    width: '200px',
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                  }}
                >
                  Receive Order
                </Button>
              )}
              
              <Button 
                size="large" 
                onClick={() => navigate('/purchases')}
                style={{ width: '150px' }}
              >
                Cancel
              </Button>
            </Space>
          </Card>
        </Form>
      </Space>
    </div>
  );
};

export default CreatePurchase;