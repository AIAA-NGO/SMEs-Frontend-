import { useState } from 'react';
import { DatePicker, Tabs, Card, Statistic, Button, message } from 'antd';
import { Download, DollarSign, PieChart } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';

const { TabPane } = Tabs;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const FinancialReports = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [profitLossData, setProfitLossData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [activeTab, setActiveTab] = useState('profit');
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchFinancialReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD')
      };

      let response;
      if (activeTab === 'profit') {
        response = await axios.get(`${API_BASE_URL}/reports/profit-loss`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfitLossData(response.data);
      } else {
        response = await axios.get(`${API_BASE_URL}/reports/tax`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setTaxData(response.data);
      }
    } catch (error) {
      console.error('Error fetching financial report:', error);
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!startDate || !endDate) {
      message.warning('Please select both start and end dates');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const reportType = activeTab === 'profit' ? 'PROFIT_LOSS' : 'TAX';
      
      const response = await axios.post(
        `${API_BASE_URL}/reports/export`,
        {
          reportType,
          startDate: dayjs(startDate).format('YYYY-MM-DD'),
          endDate: dayjs(endDate).format('YYYY-MM-DD'),
          format: 'PDF'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${activeTab}-report-${dayjs().format('YYYY-MM-DD')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      message.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `KSH ${value?.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Financial Reports</h1>
        <Button 
          icon={<Download size={16} />} 
          onClick={exportReport}
          loading={exportLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Export
        </Button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <DatePicker
          placeholder="Start Date"
          value={startDate}
          onChange={setStartDate}
          className="w-40"
          format="YYYY-MM-DD"
        />
        <DatePicker
          placeholder="End Date"
          value={endDate}
          onChange={setEndDate}
          className="w-40"
          format="YYYY-MM-DD"
        />
        <Button 
          type="primary" 
          onClick={fetchFinancialReport}
          loading={loading}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          Generate Report
        </Button>
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <DollarSign size={16} />
              Profit & Loss
            </span>
          }
          key="profit"
        >
          {profitLossData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={formatCurrency(profitLossData.totalRevenue)}
                  prefix={<span className="text-green-500">↑</span>}
                />
              </Card>
              <Card>
                <Statistic
                  title="Total Expenses"
                  value={formatCurrency(profitLossData.totalExpenses)}
                  prefix={<span className="text-red-500">↓</span>}
                />
              </Card>
              <Card>
                <Statistic
                  title="Net Profit"
                  value={formatCurrency(profitLossData.netProfit)}
                  valueStyle={{ 
                    color: profitLossData.netProfit >= 0 ? '#3f8600' : '#cf1322',
                    fontWeight: 'bold'
                  }}
                />
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Loading report data...' : 'Select date range and generate report'}
            </div>
          )}
        </TabPane>
        
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <PieChart size={16} />
              Tax Report
            </span>
          }
          key="tax"
        >
          {taxData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <Statistic
                  title="Taxable Sales"
                  value={formatCurrency(taxData.taxableSales)}
                />
              </Card>
              <Card>
                <Statistic
                  title="Tax Collected"
                  value={formatCurrency(taxData.taxCollected)}
                />
              </Card>
              <Card>
                <Statistic
                  title="Tax Owed"
                  value={formatCurrency(taxData.taxOwed)}
                  valueStyle={{ 
                    color: '#cf1322',
                    fontWeight: 'bold'
                  }}
                />
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Loading report data...' : 'Select date range and generate report'}
            </div>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default FinancialReports;