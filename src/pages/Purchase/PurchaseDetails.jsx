import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const data = await getAllPurchases();
      setPurchases(data);
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

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `PO-${id.toString().padStart(5, '0')}`,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'companyName'],
      key: 'supplier',
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      render: (date) => date ? formatDate(date) : '-',
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
    },
    {
      title: 'Total Amount (KES)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => formatCurrencyKES(amount),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Discount Amount (KES)',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amount) => formatCurrencyKES(amount),
    },
    {
      title: 'Tax Amount (KES)',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      render: (amount) => formatCurrencyKES(amount),
    },
    {
      title: 'Final Amount (KES)',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (amount) => formatCurrencyKES(amount),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: (
                  <Link to={`/purchases/${record.id}`}>
                    <EyeOutlined /> View Details
                  </Link>
                ),
              },
              {
                key: 'edit',
                label: (
                  <Link to={`/purchases/edit/${record.id}`}>
                    <EditOutlined /> Edit
                  </Link>
                ),
                disabled: record.status === 'CANCELLED',
              },
              {
                key: 'delete',
                label: (
                  <span onClick={() => {
                    setSelectedPurchase(record);
                    setIsDeleteModalVisible(true);
                  }}>
                    <DeleteOutlined /> Delete
                  </span>
                ),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="purchase-list">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Purchase Orders</h2>
        <Link to="/purchases/create">
          <Button type="primary">Create Purchase</Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={purchases}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1500 }}
      />

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
          <p style={{ color: 'red' }}>Warning: This order has been marked as RECEIVED.</p>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseList;