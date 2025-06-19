import React, { useState, useEffect } from 'react';
import { 
  getProfitLossReport, 
  exportReport
} from '../../services/financialServices';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import { Table, Card, Statistic, Button, Row, Col, Tabs, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const FinancialReports = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [profitLossData, setProfitLossData] = useState({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    revenueBreakdown: [],
    expenseBreakdown: []
  });
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('CSV');

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profitLoss = await getProfitLossReport(startDate, endDate);
      setProfitLossData({
        totalRevenue: profitLoss?.totalRevenue || 0,
        totalCost: profitLoss?.totalCost || 0,
        netProfit: profitLoss?.netProfit || 0,
        revenueBreakdown: profitLoss?.revenueBreakdown || [],
        expenseBreakdown: profitLoss?.expenseBreakdown || []
      });
    } catch (error) {
      console.error('Error fetching profit & loss report:', error);
      message.error('Failed to load profit & loss data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportReport({
        reportType: 'PROFIT_LOSS',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        format: exportFormat
      });
      
      const filename = `profit_loss_report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`;
      saveAs(blob, filename);
      message.success('Export started successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('Failed to export report');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const renderProfitLossReport = () => {
    return (
      <div className="space-y-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Total Revenue" 
                value={formatCurrency(profitLossData.totalRevenue)}
                valueStyle={{ color: '#10B981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Total Cost" 
                value={formatCurrency(profitLossData.totalCost)}
                valueStyle={{ color: '#EF4444' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Net Profit" 
                value={formatCurrency(profitLossData.netProfit)}
                valueStyle={{ 
                  color: profitLossData.netProfit >= 0 ? '#10B981' : '#EF4444' 
                }}
              />
            </Card>
          </Col>
        </Row>

        {profitLossData.revenueBreakdown?.length > 0 && (
          <Card title="Revenue Breakdown">
            <Table
              columns={[
                { title: 'Category', dataIndex: 'category', key: 'category' },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: text => formatCurrency(text) },
                { title: 'Percentage', dataIndex: 'percentage', key: 'percentage', render: text => `${text}%` }
              ]}
              dataSource={profitLossData.revenueBreakdown}
              rowKey="category"
              pagination={false}
              scroll={{ x: true }}
            />
          </Card>
        )}

        {profitLossData.expenseBreakdown?.length > 0 && (
          <Card title="Expense Breakdown">
            <Table
              columns={[
                { title: 'Category', dataIndex: 'category', key: 'category' },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: text => formatCurrency(text) },
                { title: 'Percentage', dataIndex: 'percentage', key: 'percentage', render: text => `${text}%` }
              ]}
              dataSource={profitLossData.expenseBreakdown}
              rowKey="category"
              pagination={false}
              scroll={{ x: true }}
            />
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Profit & Loss Report</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            loading={loading}
            className="w-full sm:w-auto"
          >
            Export Report
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            className="w-full sm:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        renderProfitLossReport()
      )}
    </div>
  );
};

export default FinancialReports;