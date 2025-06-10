const STORAGE_KEY = 'products';

// Get all products
export const getAllProducts = async () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Add a new product
export const addProduct = async (product) => {
  const products = await getAllProducts();
  const newProduct = {
    product_id: Date.now(), // unique ID
    ...product,
    product_qty: Number(product.product_qty) || 0,
    product_price: Number(product.product_price) || 0,
  };
  products.push(newProduct);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  return newProduct;
};

// Update product
export const updateProduct = async (id, updatedData) => {
  const products = await getAllProducts();
  const updated = products.map((p) =>
    p.product_id === id ? { ...p, ...updatedData } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find((p) => p.product_id === id);
};

// Delete product
export const deleteProduct = async (id) => {
  const products = await getAllProducts();
  const filtered = products.filter((p) => p.product_id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return id;
};

// Restock product (increase quantity)
export const restockProduct = async (id, quantityToAdd) => {
  const products = await getAllProducts();
  const updated = products.map((p) => {
    if (p.product_id === id) {
      const currentQty = Number(p.product_qty) || 0;
      const addQty = Number(quantityToAdd) || 0;
      return { ...p, product_qty: currentQty + addQty };
    }
    return p;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find((p) => p.product_id === id);
};
