const SUPPLIERS_KEY = 'mock_suppliers';

const loadSuppliers = () => {
  const suppliersJSON = localStorage.getItem(SUPPLIERS_KEY);
  return suppliersJSON ? JSON.parse(suppliersJSON) : [];
};

const saveSuppliers = (suppliers) => {
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
};

export const getSuppliers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(loadSuppliers());
    }, 300);
  });
};

export const addSupplier = (supplier) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!supplier.supplier_name || !supplier.supplier_category) {
        reject(new Error('Name and category are required'));
        return;
      }

      const suppliers = loadSuppliers();
      const newSupplier = {
        supplier_id: suppliers.length + 1,
        ...supplier,
      };

      suppliers.push(newSupplier);
      saveSuppliers(suppliers);
      resolve(newSupplier);
    }, 300);
  });
};
