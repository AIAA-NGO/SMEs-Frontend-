import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const extractArrayData = (data) => {
  if (!data) return [];
  
  // Handle paginated responses
  if (data.content && Array.isArray(data.content)) {
    return data.content;
  }
  
  // Handle other possible array locations
  const possibleKeys = ["products", "data", "items", "results"];
  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }
  
  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  
  // Fallback to empty array
  return [];
};

const transformProduct = (product) => ({
  id: product.id,
  name: product.name || "",
  description: product.description || "",
  quantityInStock: Number(product.quantityInStock || product.quantity_in_stock) || 0,
  categoryId: Number(product.categoryId || product.category_id) || 0,
  supplierId: product.supplierId || product.supplier_id || "",
  price: Number(product.price) || 0,
  imageUrl: product.imageUrl || null,
  sku: product.sku || "",
  barcode: product.barcode || "",
  brandId: product.brandId || product.brand_id || null,
  unitId: product.unitId || product.unit_id || null,
  costPrice: product.costPrice || product.cost_price || 0,
  lowStockThreshold: product.lowStockThreshold || product.low_stock_threshold || 0,
  expiryDate: product.expiryDate || product.expiry_date || null,
  categoryName: product.categoryName || null,
  brandName: product.brandName || null,
  unitName: product.unitName || null,
  supplierName: product.supplierName || null
});

export const getAllProducts = async () => {
  try {
    const response = await api.get("/products");
    const products = extractArrayData(response.data);
    return products.map(transformProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return transformProduct(response.data);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const response = await api.post("/products", productData);
    return transformProduct(response.data);
  } catch (error) {
    console.error("Error adding product:", error);
    if (error.response?.data?.errors) {
      const validationErrors = {};
      error.response.data.errors.forEach(err => {
        validationErrors[err.field] = err.defaultMessage || err.message;
      });
      throw { validationErrors };
    }
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return transformProduct(response.data);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    if (error.response?.data?.errors) {
      const validationErrors = {};
      error.response.data.errors.forEach(err => {
        validationErrors[err.field] = err.defaultMessage || err.message;
      });
      throw { validationErrors };
    }
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`);
    return id;
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await api.get(`/products/search?query=${query}`);
    const data = extractArrayData(response.data);
    return data.map(transformProduct);
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

export const getLowStockProducts = async () => {
  try {
    const response = await api.get('/products/low-stock');
    const data = extractArrayData(response.data);
    return data.map(transformProduct);
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw error;
  }
};

export const restockProduct = async (id, quantity) => {
  try {
    const response = await api.patch(`/products/${id}/restock`, { quantity });
    return transformProduct(response.data);
  } catch (error) {
    console.error(`Error restocking product ${id}:`, error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return extractArrayData(response.data);
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getBrands = async () => {
  try {
    const response = await api.get('/brands');
    return extractArrayData(response.data);
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }
};

export const getUnits = async () => {
  try {
    const response = await api.get('/units');
    return extractArrayData(response.data);
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
};

export const getSuppliers = async () => {
  try {
    const response = await api.get('/suppliers');
    const data = extractArrayData(response.data);
    return data.map(supplier => ({
      id: supplier.id,
      companyName: supplier.companyName || "",
      contactPerson: supplier.contactPerson || supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      website: supplier.website || ""
    }));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
};

export default {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStockProducts,
  restockProduct,
  getCategories,
  getBrands,
  getUnits,
  getSuppliers
};