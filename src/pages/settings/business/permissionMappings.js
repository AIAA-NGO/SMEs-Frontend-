export const rolePermissions = {
    ADMIN: [
      'dashboard_view',
      'customer_create', 'customer_view', 'customer_update', 'customer_delete', 'customer_sales',
      'supplier_view', 'supplier_create', 'supplier_update', 'supplier_delete',
      'product_create', 'product_view', 'product_update', 'product_delete', 'product_import', 'product_purchase',
      'brand_create', 'brand_view', 'brand_update', 'brand_delete',
      'category_create', 'category_view', 'category_update', 'category_delete',
      'unit_create', 'unit_view', 'unit_update', 'unit_delete',
      'sale_create', 'sale_view', 'sale_update', 'sale_delete', 'sale_edit',
      'purchase_create', 'purchase_view', 'purchase_update', 'purchase_delete',
      'reports_summary', 'reports_sales', 'reports_inventory',
      'role_create', 'role_view', 'role_update', 'role_delete',
      'permission_view',
      'user_create', 'user_view', 'user_update', 'user_delete', 'user_suspend',
      'website_settings', 'contact_settings', 'socials_settings',
      'style_settings', 'custom_settings', 'notification_settings',
      'website_status_settings', 'invoice_settings'
    ],
    MANAGER: [
      'dashboard_view',
      'customer_view', 'customer_sales',
      'supplier_view',
      'product_view', 'product_purchase',
      'brand_view',
      'category_view',
      'unit_view',
      'sale_create', 'sale_view', 'sale_edit',
      'purchase_view',
      'reports_summary', 'reports_sales',
      'permission_view',
      'user_view'
    ],
    CASHIER: [
      'dashboard_view',
      'customer_view',
      'product_view',
      'sale_create', 'sale_view',
      'reports_sales'
    ]
  };
  
  export const permissionCategories = [
    { name: 'Dashboard', permissions: ['dashboard_view'] },
    { name: 'Customer', permissions: ['customer_create', 'customer_view', 'customer_update', 'customer_delete', 'customer_sales'] },
    { name: 'Supplier', permissions: ['supplier_view', 'supplier_create', 'supplier_update', 'supplier_delete'] },
    { name: 'Product', permissions: ['product_create', 'product_view', 'product_update', 'product_delete', 'product_import', 'product_purchase'] },
    { name: 'Brand', permissions: ['brand_create', 'brand_view', 'brand_update', 'brand_delete'] },
    { name: 'Category', permissions: ['category_create', 'category_view', 'category_update', 'category_delete'] },
    { name: 'Unit', permissions: ['unit_create', 'unit_view', 'unit_update', 'unit_delete'] },
    { name: 'Sale', permissions: ['sale_create', 'sale_view', 'sale_update', 'sale_delete', 'sale_edit'] },
    { name: 'Purchase', permissions: ['purchase_create', 'purchase_view', 'purchase_update', 'purchase_delete'] },
    { name: 'Report', permissions: ['reports_summary', 'reports_sales', 'reports_inventory'] },
    { name: 'Role', permissions: ['role_create', 'role_view', 'role_update', 'role_delete'] },
    { name: 'Permission', permissions: ['permission_view'] },
    { name: 'User', permissions: ['user_create', 'user_view', 'user_update', 'user_delete', 'user_suspend'] },
    { name: 'Settings', permissions: [
      'website_settings', 'contact_settings', 'socials_settings',
      'style_settings', 'custom_settings', 'notification_settings',
      'website_status_settings', 'invoice_settings'
    ]}
  ];