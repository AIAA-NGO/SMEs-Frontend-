import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllPurchases, deletePurchase } from '../../services/purchaseService';
import { formatDate } from '../../components/utils/formatUtils';
import { Table, Button, Dropdown, Modal, message, Tag } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

// KES currency formatter
const formatCurrencyKES = (amount) => {
  if (amount === null || amount === undefined) return 'KES 0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const data = await getAllPurchases();
      // Calculate paid amount for each purchase
      const purchasesWithPaidAmount = data.map(purchase => ({
        ...purchase,
        paidAmount: purchase.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      }));
      setPurchases(purchasesWithPaidAmount);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePurchase(selectedPurchase.id);
      message.success('Purchase deleted successfully');
      fetchPurchases();
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsDeleteModalVisible(false);
    }
  };

  const getStatusTag = (status) => {
    let color = '';
    switch (status) {
      case 'CANCELLED':
        color = 'red';
        break;
      case 'PENDING':
        color = 'orange';
        break;
      case 'RECEIVED':
        color = 'green';
        break;
      default:
        color = 'default';
    }
    return <Tag color={color}>{status}</Tag>;
  };

  const toggleExpandRow = (id) => {
    setExpandedRowKeys(expandedRowKeys.includes(id) 
      ? expandedRowKeys.filter(key => key !== id) 
      : [...expandedRowKeys, id]);
  };

  const handleView = (id) => {
    navigate(`/purchases/${id}`);
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `PO-${id.toString().padStart(5, '0')}`,
      sorter: (a, b) => a.id - b.id,
      fixed: 'left',
      width: 120,
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'companyName'],
      key: 'supplier',
      responsive: ['md'],
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'CANCELLED', value: 'CANCELLED' },
        { text: 'PENDING', value: 'PENDING' },
        { text: 'RECEIVED', value: 'RECEIVED' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 120,
    },
    {
      title: 'Total (KES)',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (amount) => formatCurrencyKES(amount),
      sorter: (a, b) => a.finalAmount - b.finalAmount,
      width: 150,
    },
    {
      title: 'Paid (KES)',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount) => formatCurrencyKES(amount),
      sorter: (a, b) => a.paidAmount - b.paidAmount,
      width: 150,
      responsive: ['md'],
    },
    {
      title: 'Balance (KES)',
      key: 'balance',
      render: (_, record) => formatCurrencyKES(record.finalAmount - (record.paidAmount || 0)),
      width: 150,
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record.id)}
            aria-label="View details"
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: (
                    <Link to={`/purchases/edit/${record.id}`} className="flex items-center gap-2">
                      <EditOutlined /> Edit
                    </Link>
                  ),
                  disabled: record.status === 'CANCELLED',
                },
                {
                  key: 'delete',
                  label: (
                    <span 
                      onClick={() => {
                        setSelectedPurchase(record);
                        setIsDeleteModalVisible(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <DeleteOutlined /> Delete
                    </span>
                  ),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="More actions" />
          </Dropdown>
        </div>
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const balance = record.finalAmount - (record.paidAmount || 0);
    
    return (
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Supplier</p>
            <p>{record.supplier?.companyName || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Order Date</p>
            <p>{formatDate(record.orderDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Received Date</p>
            <p>{record.receivedDate ? formatDate(record.receivedDate) : '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Discount Amount</p>
            <p>{formatCurrencyKES(record.discountAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tax Amount</p>
            <p>{formatCurrencyKES(record.taxAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <p>{formatCurrencyKES(record.finalAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Amount Paid</p>
            <p>{formatCurrencyKES(record.paidAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Balance</p>
            <p className={balance > 0 ? 'text-red-500' : 'text-green-500'}>
              {formatCurrencyKES(balance)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button 
            type="primary" 
            onClick={() => handleView(record.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            View Full Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
        <Link to="/purchases/create">
          <Button type="primary" className="bg-blue-600 hover:bg-blue-700">
            Create Purchase
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          dataSource={purchases}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            className: 'px-4 py-2'
          }}
          scroll={{ x: true }}
          size="middle"
          className="w-full"
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpand: (expanded, record) => toggleExpandRow(record.id),
            rowExpandable: () => true,
            expandIcon: ({ expanded, onExpand, record }) => (
              <button 
                onClick={e => onExpand(record, e)} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={expanded ? 'Collapse row' : 'Expand row'}
              >
                {expanded ? '▼' : '►'}
              </button>
            ),
          }}
        />
      </div>

      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete purchase order PO-{selectedPurchase?.id.toString().padStart(5, '0')}?</p>
        {selectedPurchase?.status === 'RECEIVED' && (
          <p className="text-red-500 mt-2">Warning: This order has been marked as RECEIVED.</p>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseList;