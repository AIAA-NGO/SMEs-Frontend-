import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function SalesReturnPage() {
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [filter, setFilter] = useState({ customer: '', cashier: '', date: '' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch products - ensure the response data is an array
        const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure we're setting an array, even if the response is nested
        setProducts(Array.isArray(productsResponse.data) 
          ? productsResponse.data 
          : productsResponse.data?.products || []);

        // Fetch returns - ensure the response data is an array
        const returnsResponse = await axios.get(`${API_BASE_URL}/sales/returns`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReturns(Array.isArray(returnsResponse.data) 
          ? returnsResponse.data 
          : returnsResponse.data?.returns || []);

      } catch (err) {
        console.error('Failed to load data', err);
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const handleAddReturn = async (product) => {
    const existing = returns.find((r) => r.product_id === product.product_id);
    if (existing) {
      message.warning('Product already added. You can update the quantity.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const newReturn = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        quantity: 1,
        customer_name: customerName,
        cashier_name: cashierName,
        return_date: new Date().toISOString()
      };

      const response = await axios.post(`${API_BASE_URL}/sales/returns`, newReturn, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReturns([...returns, response.data]);
      message.success('Return added successfully');
    } catch (error) {
      console.error('Failed to add return', error);
      message.error('Failed to add return');
    }
  };

  const handleUpdateQty = async (id, delta) => {
    try {
      const token = localStorage.getItem('token');
      const returnToUpdate = returns.find(r => r.id === id);
      const newQty = Math.max(1, returnToUpdate.quantity + delta);

      const response = await axios.put(
        `${API_BASE_URL}/sales/returns/${id}`,
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReturns(returns.map(r => r.id === id ? response.data : r));
    } catch (error) {
      console.error('Failed to update quantity', error);
      message.error('Failed to update quantity');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/sales/returns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReturns(returns.filter(r => r.id !== id));
      message.success('Return deleted successfully');
    } catch (error) {
      console.error('Failed to delete return', error);
      message.error('Failed to delete return');
    }
  };

  const handleProcessReturns = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/sales/process-returns`,
        { returns },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReturns([]);
      message.success('Returns processed successfully');
    } catch (error) {
      console.error('Failed to process returns', error);
      message.error('Failed to process returns');
    }
  };

  const filteredReturns = returns.filter((r) => {
    return (
      (!filter.customer || r.customer_name.toLowerCase().includes(filter.customer.toLowerCase())) &&
      (!filter.cashier || r.cashier_name.toLowerCase().includes(filter.cashier.toLowerCase())) &&
      (!filter.date || r.return_date.split('T')[0] === filter.date)
    );
  });

  const matchingProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Sales Returns</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ⬅ Back to POS
          </button>
          {returns.length > 0 && (
            <button
              onClick={handleProcessReturns}
              className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Process Returns'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer Name"
          className="p-2 border rounded w-full"
        />
        <input
          value={cashierName}
          onChange={(e) => setCashierName(e.target.value)}
          placeholder="Cashier Name"
          className="p-2 border rounded w-full"
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Product"
          className="p-2 border rounded w-full"
        />
      </div>

      {searchTerm && (
        <div className="mb-4 bg-white rounded shadow p-3">
          <h4 className="font-semibold mb-2">Search Results:</h4>
          {matchingProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {matchingProducts.map((product) => (
                <button
                  key={product.product_id}
                  onClick={() => handleAddReturn(product)}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-left"
                >
                  {product.product_name} — Ksh {product.product_price.toFixed(2)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No matching products</p>
          )}
        </div>
      )}

      <div className="mb-4 bg-white p-4 rounded shadow">
        <h4 className="text-lg font-semibold mb-2">Filter Returns</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={filter.customer}
            onChange={(e) => setFilter({ ...filter, customer: e.target.value })}
            placeholder="Filter by customer"
            className="p-2 border rounded"
          />
          <input
            value={filter.cashier}
            onChange={(e) => setFilter({ ...filter, cashier: e.target.value })}
            placeholder="Filter by cashier"
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h4 className="text-lg font-semibold mb-3">Return List</h4>
        {filteredReturns.length === 0 ? (
          <p className="text-gray-500">No return records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Qty</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Customer</th>
                  <th className="p-2 border">Cashier</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 border">{r.product_name}</td>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQty(r.id, -1)}
                          className="px-2 py-0.5 bg-red-500 text-white rounded"
                        >
                          -
                        </button>
                        <span>{r.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(r.id, 1)}
                          className="px-2 py-0.5 bg-green-500 text-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-2 border">Ksh {(r.product_price * r.quantity).toFixed(2)}</td>
                    <td className="p-2 border">{r.customer_name}</td>
                    <td className="p-2 border">{r.cashier_name}</td>
                    <td className="p-2 border">{r.return_date.split('T')[0]}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}