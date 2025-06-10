import { useEffect, useState } from "react";
import axios from "axios";

export default function OrderDetails({ orderId, onStatusChange }) {
  const [details, setDetails] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!orderId) return;

    axios.get(`/api/orders/${orderId}`)
      .then(res => {
        setOrderInfo(res.data);
        setStatus(res.data.orderStatus);
      })
      .catch(() => setOrderInfo(null));

    axios.get(`/api/orders/${orderId}/details`)
      .then(res => setDetails(res.data))
      .catch(() => setDetails([]));
  }, [orderId]);

  const handleStatusUpdate = () => {
    axios.put(`/api/orders/${orderId}/status`, { status })
      .then(() => {
        alert("Order status updated!");
        if (onStatusChange) onStatusChange();
      })
      .catch(() => alert("Failed to update status"));
  };

  if (!orderId) return <div>Select an order to see details</div>;

  if (!orderInfo) return <div>Loading order info...</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Order #{orderInfo.orderID} Details</h3>
      <p><strong>Customer:</strong> {orderInfo.customerID}</p>
      <p><strong>Order Date:</strong> {orderInfo.orderDate}</p>
      <p><strong>Ship Date:</strong> {orderInfo.shipDate}</p>
      <p><strong>Payment Type:</strong> {orderInfo.paymentType}</p>
      <p>
        <strong>Status:</strong>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="ml-2 p-1 border rounded"
        >
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button
          onClick={handleStatusUpdate}
          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded"
        >
          Update
        </button>
      </p>

      <h4 className="mt-4 font-semibold">Products</h4>
      <table className="min-w-full bg-white rounded shadow mt-2">
        <thead>
          <tr>
            <th className="p-2 border">Product Name</th>
            <th className="p-2 border">Quantity</th>
            <th className="p-2 border">Unit Price</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {details.map(item => (
            <tr key={item.productId}>
              <td className="p-2 border">{item.productId}</td>
              <td className="p-2 border">{item.productQty}</td>
              <td className="p-2 border">{item.unitPrice}</td>
              <td className="p-2 border">{item.productTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
