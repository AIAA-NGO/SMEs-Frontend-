import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../services/productServices';

export default function SalesReturnPage() {
  const [returns, setReturns] = useState(() => JSON.parse(localStorage.getItem('sales_returns')) || []);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [filter, setFilter] = useState({ customer: '', cashier: '', date: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodData = await getAllProducts();
        setProducts(prodData);
      } catch (err) {
        console.error('Failed to load products', err);
      }
    };
    fetchData();
  }, []);

  const handleAddReturn = (product) => {
    const existing = returns.find((r) => r.product_id === product.product_id);
    if (existing) {
      alert('Product already added. You can update the quantity.');
      return;
    }
    const newReturn = {
      id: Date.now(),
      product_id: product.product_id,
      product_name: product.product_name,
      product_price: product.product_price,
      qty: 1,
      customerName,
      cashierName,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [...returns, newReturn];
    setReturns(updated);
    localStorage.setItem('sales_returns', JSON.stringify(updated));
  };

  const handleUpdateQty = (id, delta) => {
    const updated = returns.map((r) =>
      r.id === id ? { ...r, qty: Math.max(1, r.qty + delta) } : r
    );
    setReturns(updated);
    localStorage.setItem('sales_returns', JSON.stringify(updated));
  };

  const handleDelete = (id) => {
    const updated = returns.filter((r) => r.id !== id);
    setReturns(updated);
    localStorage.setItem('sales_returns', JSON.stringify(updated));
  };

  const filteredReturns = returns.filter((r) => {
    return (
      (!filter.customer || r.customerName.toLowerCase().includes(filter.customer.toLowerCase())) &&
      (!filter.cashier || r.cashierName.toLowerCase().includes(filter.cashier.toLowerCase())) &&
      (!filter.date || r.date === filter.date)
    );
  });

  const matchingProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Sales Returns</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ⬅ Back to POS
        </button>
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
                  {product.product_name} — Ksh {product.product_price}
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
                      <span>{r.qty}</span>
                      <button
                        onClick={() => handleUpdateQty(r.id, 1)}
                        className="px-2 py-0.5 bg-green-500 text-white rounded"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-2 border">Ksh {(r.product_price * r.qty).toFixed(2)}</td>
                  <td className="p-2 border">{r.customerName}</td>
                  <td className="p-2 border">{r.cashierName}</td>
                  <td className="p-2 border">{r.date}</td>
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
        )}
      </div>
    </div>
  );
}
