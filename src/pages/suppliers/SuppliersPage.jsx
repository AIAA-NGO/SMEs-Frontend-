import React, { useEffect, useState } from 'react';
import { addSupplier, getSuppliers } from '../../services/supplierService'; // Adjust imports

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    rating: '',
    categoryIds: []
  });

  const [categories, setCategories] = useState([]);

  // Fetch categories for form select
  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setCategories(data.content || data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch suppliers list
  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSuppliers();
      setSuppliers(data.content || data);
    } catch (err) {
      setError('Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    loadSuppliers();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
    setFormData(prev => ({ ...prev, categoryIds: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await addSupplier(formData);
      setSuccess('Supplier created successfully!');
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        rating: '',
        categoryIds: []
      });
      setShowForm(false);
      loadSuppliers(); // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to create supplier');
    }
  };

  // Print suppliers list
  const handlePrint = () => {
    const printContent = document.getElementById('suppliers-table').outerHTML;
    const win = window.open('', '', 'width=900,height=650');
    win.document.write('<html><head><title>Print Suppliers</title></head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // Download CSV
  const handleDownload = () => {
    if (!suppliers.length) return;
    const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Website', 'Rating', 'Categories', 'Created At', 'Updated At'];
    const rows = suppliers.map(s => [
      s.companyName,
      s.contactPerson,
      s.email,
      s.phone,
      s.address,
      s.website,
      s.rating,
      s.categories?.map(c => c.name).join(', ') || '',
      new Date(s.createdAt).toLocaleString(),
      new Date(s.updatedAt).toLocaleString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.map(item => `"${item}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'suppliers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Supplier
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <div className="mb-4 space-x-2">
        <button
          onClick={handlePrint}
          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Print
        </button>
        <button
          onClick={handleDownload}
          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Download CSV
        </button>
      </div>

      {loading ? (
        <p>Loading suppliers...</p>
      ) : (
        <table
          id="suppliers-table"
          className="w-full border-collapse border border-gray-300"
        >
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Company Name</th>
              <th className="border border-gray-300 p-2">Contact Person</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Phone</th>
              <th className="border border-gray-300 p-2">Address</th>
              <th className="border border-gray-300 p-2">Website</th>
              <th className="border border-gray-300 p-2">Rating</th>
              <th className="border border-gray-300 p-2">Categories</th>
              <th className="border border-gray-300 p-2">Created At</th>
              <th className="border border-gray-300 p-2">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="text-center">
                <td className="border border-gray-300 p-2">{s.companyName}</td>
                <td className="border border-gray-300 p-2">{s.contactPerson}</td>
                <td className="border border-gray-300 p-2">{s.email}</td>
                <td className="border border-gray-300 p-2">{s.phone}</td>
                <td className="border border-gray-300 p-2">{s.address}</td>
                <td className="border border-gray-300 p-2">{s.website}</td>
                <td className="border border-gray-300 p-2">{s.rating}</td>
                <td className="border border-gray-300 p-2">{s.categories?.map(c => c.name).join(', ')}</td>
                <td className="border border-gray-300 p-2">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="border border-gray-300 p-2">{new Date(s.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for Add Supplier Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50">
          <div className="bg-white rounded-md shadow-lg p-6 max-w-2xl w-full relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
              aria-label="Close form"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-6">Add Supplier</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Company Name *"
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Contact Person *"
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 p-2 rounded"
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full border border-gray-300 p-2 rounded"
              />
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Address"
                className="w-full border border-gray-300 p-2 rounded"
              />
              <input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Website"
                className="w-full border border-gray-300 p-2 rounded"
              />
              <input
                name="rating"
                type="number"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                placeholder="Rating"
                className="w-full border border-gray-300 p-2 rounded"
              />

              <label className="block font-medium">Categories</label>
              <select
                multiple
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 p-2 rounded"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
