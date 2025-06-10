import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, Table, message, Card, Row, Col, InputNumber, DatePicker } from 'antd';
import { getPurchaseById, updatePurchase } from '../../services/purchaseService';
import { getSuppliers as getAllSuppliers } from '../../services/supplierService';
import { getAllProducts } from '../../services/productServices';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

// Format currency as KES
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const EditPurchase = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    fetchPurchase();
    fetchSuppliers();
    fetchProducts();
  }, [id]);

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseById(id);
      setPurchase(data);
      setItems(data.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      })));
      
      form.setFieldsValue({
        supplierId: data.supplier.id,
        orderDate: dayjs(data.orderDate),
        taxRate: data.taxAmount ? (data.taxAmount / data.totalAmount) * 100 : 0,
        discount: data.discountAmount ? (data.discountAmount / data.totalAmount) * 100 : 0,
      });
    } catch (error) {
      message.error(error.message);
      navigate('/purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await getAllSuppliers();
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
    setItems([...items, { productId: null, quantity: 1, unitPrice: 0, totalPrice: 0 }]);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (items.length === 0) {
        message.error('Please add at least one item');
        return;
      }

      if (items.some(item => !item.productId)) {
        message.error('Please select a product for all items');
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
        taxAmount: calculateTotals().taxAmount,
        discountAmount: calculateTotals().discountAmount,
      };
      
      setLoading(true);
      const updatedPurchase = await updatePurchase(id, purchaseData);
      message.success('Purchase order updated successfully');
      navigate(`/purchases/${updatedPurchase.id}`);
    } catch (error) {
      message.error(error.message || 'Failed to update purchase');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  if (!purchase) return null;

  return (
    <div className="edit-purchase">
      <h2>Edit Purchase Order #{purchase.id.toString().padStart(5, '0')}</h2>
      
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supplierId"
              label="Supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select 
                placeholder="Select supplier" 
                showSearch 
                optionFilterProp="children"
                disabled={loading}
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
              label="Order Date"
              rules={[{ required: true, message: 'Please select order date' }]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                style={{ width: '100%' }} 
                disabled={loading}
              />
            </Form.Item>
          </Col>
        </Row>

        <Card title="Items" style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            onClick={handleAddItem}
            icon={<PlusOutlined />}
            style={{ marginBottom: 16 }}
            disabled={loading}
          >
            Add Item
          </Button>

          <Table
            dataSource={items}
            rowKey={(record, index) => index}
            pagination={false}
            loading={loading}
            columns={[
              {
                title: 'Product',
                dataIndex: 'productId',
                render: (value, record, index) => (
                  <Select
                    placeholder="Select product"
                    value={value}
                    style={{ width: '100%' }}
                    onChange={(val) => handleItemChange(index, 'productId', val)}
                    disabled={loading}
                  >
                    {products.map(product => (
                      <Option key={product.id} value={product.id}>
                        {product.name}
                      </Option>
                    ))}
                  </Select>
                ),
              },
              {
                title: 'Quantity',
                dataIndex: 'quantity',
                render: (value, record, index) => (
                  <InputNumber
                    min={1}
                    value={value}
                    onChange={(val) => handleItemChange(index, 'quantity', val)}
                    disabled={loading}
                  />
                ),
              },
              {
                title: 'Unit Price (KES)',
                dataIndex: 'unitPrice',
                render: (value, record, index) => (
                  <InputNumber
                    min={0}
                    step={0.01}
                    value={value}
                    onChange={(val) => handleItemChange(index, 'unitPrice', val)}
                    formatter={(value) => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/KES\s?|(,*)/g, '')}
                    disabled={loading}
                  />
                ),
              },
              {
                title: 'Total (KES)',
                dataIndex: 'totalPrice',
                render: (value) => formatCurrency(value || 0),
              },
              {
                title: 'Action',
                render: (_, record, index) => (
                  <Button
                    danger
                    type="text"
                    icon={<MinusOutlined />}
                    onClick={() => handleRemoveItem(index)}
                    disabled={loading}
                  />
                ),
              },
            ]}
          />
        </Card>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="taxRate" label="Tax Rate (%)">
              <InputNumber 
                min={0} 
                max={100} 
                style={{ width: '100%' }} 
                disabled={loading}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="discount" label="Discount (%)">
              <InputNumber 
                min={0} 
                max={100} 
                style={{ width: '100%' }} 
                disabled={loading}
              />
            </Form.Item>
          </Col>
        </Row>

        <Card title="Summary" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <p>Subtotal: {formatCurrency(subtotal)}</p>
              <p>Tax: {formatCurrency(taxAmount)}</p>
              <p>Discount: {formatCurrency(discountAmount)}</p>
              <p><strong>Total: {formatCurrency(total)}</strong></p>
            </Col>
          </Row>
        </Card>

        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Update Purchase Order
          </Button>
          <Button 
            style={{ marginLeft: 8 }} 
            onClick={() => navigate(`/purchases/${id}`)}
            disabled={loading}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditPurchase;