const CATEGORIES_KEY = "mock_categories";

const loadCategories = () => {
  const categoriesJSON = localStorage.getItem(CATEGORIES_KEY);
  return categoriesJSON ? JSON.parse(categoriesJSON) : [];
};

const saveCategories = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getCategories = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(loadCategories());
    }, 300);
  });
};

export const addCategory = (category) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!category.category_name || !category.category_name.trim()) {
        reject(new Error("Category name is required"));
        return;
      }

      const categories = loadCategories();

      if (categories.some(c => c.category_name.toLowerCase() === category.category_name.toLowerCase())) {
        reject(new Error("Category already exists"));
        return;
      }

      const newCategory = {
        category_id: categories.length + 1,
        category_name: category.category_name.trim(),
      };

      categories.push(newCategory);
      saveCategories(categories);

      resolve(newCategory);
    }, 300);
  });
};
