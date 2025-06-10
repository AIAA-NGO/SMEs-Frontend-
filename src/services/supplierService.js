const API_BASE_URL = 'http://localhost:8080/api';

// Get auth headers with token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getSuppliers = async () => {
  const response = await fetch(`${API_BASE_URL}/suppliers`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error('Failed to fetch suppliers');
  return response.json();
};

export const getSupplierDetails = async (id) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error(`Failed to fetch supplier ${id}`);
  return response.json();
};

export const addSupplier = async (supplier) => {
  const response = await fetch(`${API_BASE_URL}/suppliers`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      website: supplier.website,
      rating: parseFloat(supplier.rating),
      categoryIds: supplier.categoryIds
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to add supplier');
  }

  return response.json();
};


export const updateSupplier = async (id, supplier) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({
      company_name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update supplier');
  }
  return response.json();
};

export const deleteSupplier = async (id) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error('Failed to delete supplier');
  return true;
};
