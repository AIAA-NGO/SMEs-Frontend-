import React, { useState, useEffect } from 'react';
import { 
  getProfitLossReport, 
  exportReport
} from '../../services/financialServices';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import { Table, Card, Statistic, Button, Row, Col, Tabs, message, Divider } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  LineChartOutlined
} from '@ant-design/icons';

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
        {/* Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
              <Statistic 
                title={
                  <div className="flex items-center text-gray-600">
                    <DollarOutlined className="mr-2" />
                    <span>Total Revenue</span>
                  </div>
                }
                value={formatCurrency(profitLossData.totalRevenue)}
                valueStyle={{ color: '#10B981', fontSize: '1.5rem' }}
                prefix={<ArrowUpOutlined />}
                className="p-4"
              />
              <div className="bg-green-50 p-3 rounded-b-lg border-t border-green-100">
                <p className="text-sm text-green-600">
                  All income sources from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
              <Statistic 
                title={
                  <div className="flex items-center text-gray-600">
                    <DollarOutlined className="mr-2" />
                    <span>Total Cost</span>
                  </div>
                }
                value={formatCurrency(profitLossData.totalCost)}
                valueStyle={{ color: '#EF4444', fontSize: '1.5rem' }}
                prefix={<ArrowDownOutlined />}
                className="p-4"
              />
              <div className="bg-red-50 p-3 rounded-b-lg border-t border-red-100">
                <p className="text-sm text-red-600">
                  All expenses from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
              <Statistic 
                title={
                  <div className="flex items-center text-gray-600">
                    <LineChartOutlined className="mr-2" />
                    <span>Net Profit</span>
                  </div>
                }
                value={formatCurrency(profitLossData.netProfit)}
                valueStyle={{ 
                  color: profitLossData.netProfit >= 0 ? '#10B981' : '#EF4444',
                  fontSize: '1.5rem'
                }}
                prefix={profitLossData.netProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                className="p-4"
              />
              <div className={`p-3 rounded-b-lg border-t ${profitLossData.netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <p className={`text-sm ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLossData.netProfit >= 0 ? 'Profit' : 'Loss'} for the period
                </p>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Revenue Breakdown */}
        {profitLossData.revenueBreakdown?.length > 0 && (
          <Card 
            title={
              <div className="flex items-center">
                <ArrowUpOutlined className="text-green-500 mr-2" />
                <span className="font-semibold text-gray-700">Revenue Breakdown</span>
              </div>
            }
            className="shadow-sm border-0"
          >
            <Table
              columns={[
                { 
                  title: 'Category', 
                  dataIndex: 'category', 
                  key: 'category',
                  render: text => <span className="font-medium">{text}</span>
                },
                { 
                  title: 'Amount', 
                  dataIndex: 'amount', 
                  key: 'amount', 
                  render: text => <span className="text-green-600 font-medium">{formatCurrency(text)}</span>,
                  sorter: (a, b) => a.amount - b.amount
                },
                { 
                  title: 'Percentage', 
                  dataIndex: 'percentage', 
                  key: 'percentage', 
                  render: text => <span className="text-blue-600">{text}%</span>,
                  sorter: (a, b) => a.percentage - b.percentage
                }
              ]}
              dataSource={profitLossData.revenueBreakdown}
              rowKey="category"
              pagination={false}
              scroll={{ x: true }}
              className="rounded-lg"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row className="bg-gray-50">
                    <Table.Summary.Cell index={0} className="font-bold">Total Revenue</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} className="text-green-600 font-bold">
                      {formatCurrency(profitLossData.totalRevenue)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} className="text-blue-600 font-bold">100%</Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        )}

        {/* Expense Breakdown */}
        {profitLossData.expenseBreakdown?.length > 0 && (
          <Card 
            title={
              <div className="flex items-center">
                <ArrowDownOutlined className="text-red-500 mr-2" />
                <span className="font-semibold text-gray-700">Expense Breakdown</span>
              </div>
            }
            className="shadow-sm border-0"
          >
            <Table
              columns={[
                { 
                  title: 'Category', 
                  dataIndex: 'category', 
                  key: 'category',
                  render: text => <span className="font-medium">{text}</span>
                },
                { 
                  title: 'Amount', 
                  dataIndex: 'amount', 
                  key: 'amount', 
                  render: text => <span className="text-red-600 font-medium">{formatCurrency(text)}</span>,
                  sorter: (a, b) => a.amount - b.amount
                },
                { 
                  title: 'Percentage', 
                  dataIndex: 'percentage', 
                  key: 'percentage', 
                  render: text => <span className="text-blue-600">{text}%</span>,
                  sorter: (a, b) => a.percentage - b.percentage
                }
              ]}
              dataSource={profitLossData.expenseBreakdown}
              rowKey="category"
              pagination={false}
              scroll={{ x: true }}
              className="rounded-lg"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row className="bg-gray-50">
                    <Table.Summary.Cell index={0} className="font-bold">Total Expenses</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} className="text-red-600 font-bold">
                      {formatCurrency(profitLossData.totalCost)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} className="text-blue-600 font-bold">100%</Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        )}

        {/* Net Profit Summary */}
        <Card className="shadow-sm border-0 bg-blue-50">
          <div className="flex flex-col md:flex-row justify-between items-center p-4">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold text-gray-800">Net Profit Summary</h3>
              <p className="text-gray-600">
                Period: {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Net Profit/Loss</p>
              <p 
                className={`text-2xl font-bold ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(profitLossData.netProfit)}
              </p>
              <p className={`text-sm ${profitLossData.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {profitLossData.netProfit >= 0 ? (
                  <span>Profit margin: {((profitLossData.netProfit / profitLossData.totalRevenue) * 100 || 0).toFixed(2)}%</span>
                ) : (
                  <span>Loss margin: {((Math.abs(profitLossData.netProfit) / profitLossData.totalRevenue) * 100 || 0).toFixed(2)}%</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Profit & Loss Report</h1>
          <p className="text-gray-600 mt-1">Financial performance analysis</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            loading={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 border-blue-600 h-10"
            size="large"
          >
            Export Report
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            className="w-full sm:w-auto h-10"
            size="large"
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Filters Section */}
      <Card className="mb-6 shadow-sm border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="w-full border border-gray-300 rounded-lg p-2 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
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
              className="w-full border border-gray-300 rounded-lg p-2 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
            >
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button 
              type="default"
              onClick={() => {
                setStartDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));
                setEndDate(new Date());
              }}
              className="w-full h-10"
            >
              Reset to Last Month
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading financial data...</span>
        </div>
      ) : (
        renderProfitLossReport()
      )}
    </div>
  );
};

export default FinancialReports;