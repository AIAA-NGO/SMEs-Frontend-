import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const extractArrayData = (data) => {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const possibleKeys = ["content", "products", "data", "items", "results"];
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
    console.error("Invalid response format:", data);
    return [];
  }
  return data;
};

const transformProduct = (product) => ({
  id: product.id,
  name: product.name || "",
  description: product.description || "",
  quantity_in_stock: Number(product.quantityInStock || product.quantity_in_stock) || 0,
  category_id: Number(product.categoryId || product.category_id) || 0,
  supplier_id: product.supplierId || product.supplier_id || "",
  price: Number(product.price) || 0,
  image_data: product.image_data ,
  sku: product.sku || "",
  barcode: product.barcode || "",
  brand_id: product.brandId || product.brand_id || null,
  unit_id: product.unitId || product.unit_id || null,
  cost_price: product.costPrice || product.cost_price || 0,
  low_stock_threshold: product.lowStockThreshold || product.low_stock_threshold || 0,
  expiry_date: product.expiryDate || product.expiry_date || null
});

export const getAllProducts = async () => {
  try {
    let allProducts = [];
    let currentPage = 0;
    let totalPages = 1;
    
    while (currentPage < totalPages) {
      const response = await api.get(`/products?page=${currentPage}`);
      const responseData = response.data;
      
      if (responseData.content) {
        allProducts = [...allProducts, ...responseData.content];
        totalPages = responseData.totalPages || 1;
      } else {
        const data = extractArrayData(responseData);
        allProducts = [...allProducts, ...data];
        break;
      }
      
      currentPage++;
    }

    return allProducts.map(transformProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get("/categories");
    const data = extractArrayData(response.data);
    
    return data.map((category) => ({
      id: category.id,
      name: category.name || "Unnamed Category",
      description: category.description || "",
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getBrands = async () => {
  try {
    const response = await api.get("/brands");
    const data = extractArrayData(response.data);
    
    return data.map((brand) => ({
      id: brand.id,
      name: brand.name || "Unnamed Brand",
      description: brand.description || "",
    }));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

export const getUnits = async () => {
  try {
    const response = await api.get("/units");
    const data = extractArrayData(response.data);
    
    return data.map((unit) => ({
      id: unit.id,
      name: unit.name || "Unnamed Unit",
      description: unit.description || "",
      abbreviation: unit.abbreviation || unit.unitAbbreviation || "",
    }));
  } catch (error) {
    console.error("Error fetching units:", error);
    return [];
  }
};

export const getSuppliers = async () => {
  try {
    const response = await api.get("/suppliers");
    const data = extractArrayData(response.data);
    
    return data.map((supplier) => ({
      id: supplier.id,
      companyName: supplier.companyName || supplier.name || "Unnamed Supplier",
      name: supplier.name || supplier.companyName || "Unnamed Supplier",
      description: supplier.description || "",
      contact: supplier.contact || "",
      email: supplier.email || "",
    }));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

export const addProduct = async (product) => {
  try {
    let response;
    
    if (product instanceof FormData) {
      response = await api.post("/products", product, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
    } else {
      response = await api.post("/products", product);
    }
    
    return response.data;
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

export const updateProduct = async (productId, updatedData) => {
  try {
    const response = await api.put(`/products/${productId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`);
    return id;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

export const restockProduct = async (id, quantityToAdd) => {
  try {
    const response = await api.patch(`/products/${id}/restock`, {
      quantity: quantityToAdd
    });
    return response.data;
  } catch (error) {
    console.error("Error restocking product:", error);
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
    return [];
  }
};