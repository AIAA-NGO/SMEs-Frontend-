// frontend/src/pages/sales/SalesReturns.jsx
import React, { useState, useEffect } from 'react';

export default function SalesReturns() {
  const [returns, setReturns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(1);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('sales_returns')) || [];
    setReturns(data);
  }, []);

  const handleEdit = (r) => {
    setEditingId(r.id);
    setEditQty(r.qty);
  };

  const handleSave = (id) => {
    const updated = returns.map((r) =>
      r.id === id ? { ...r, qty: editQty } : r
    );
    setReturns(updated);
    localStorage.setItem('sales_returns', JSON.stringify(updated));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    const updated = returns.filter((r) => r.id !== id);
    setReturns(updated);
    localStorage.setItem('sales_returns', JSON.stringify(updated));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold mb-4">All Sales Returns</h2>
      {returns.length === 0 ? (
        <p>No return records found.</p>
      ) : (
        <table className="w-full table-auto border shadow-sm bg-white">
          <thead>
            <tr className="bg-gray-200">
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
            {returns.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.product_name}</td>
                <td className="p-2 border">
                  {editingId === r.id ? (
                    <input
                      type="number"
                      min="1"
                      value={editQty}
                      onChange={(e) => setEditQty(Number(e.target.value))}
                      className="w-20 p-1 border rounded"
                    />
                  ) : (
                    r.qty
                  )}
                </td>
                <td className="p-2 border">Ksh {(r.qty * r.product_price).toFixed(2)}</td>
                <td className="p-2 border">{r.customerName}</td>
                <td className="p-2 border">{r.cashierName}</td>
                <td className="p-2 border">{r.date}</td>
                <td className="p-2 border flex gap-2">
                  {editingId === r.id ? (
                    <>
                      <button
                        onClick={() => handleSave(r.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-400 text-white rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(r)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
