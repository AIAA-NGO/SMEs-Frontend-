// src/components/Sidebar.jsx
import {
  Home,
  Boxes,
  Users,
  ShoppingCart,
  FileBarChart2,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';


export default function Sidebar({
  isMobileOpen,
  isMinimized,
  onLinkClick,
  onToggleMinimize
}) {
  const location = useLocation();

  // Dropdown states
  const [productsOpen, setProductsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`
      fixed top-0 left-0 h-full z-50
      bg-gray-900 text-white shadow-lg
      overflow-y-auto transition-all duration-300 ease-in-out
      transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      w-64 ${isMinimized ? 'md:w-20' : 'md:w-64'}
    `}>
      {/* Logo & Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
       
          {!isMinimized && <span className="text-lg font-semibold select-none"></span>}
        </div>
        <button
          onClick={onToggleMinimize}
          className="hidden md:inline-flex p-1 rounded hover:bg-gray-700 transition"
          aria-label={isMinimized ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 px-1 mt-2 select-none">
        {/* Home */}
        <Link
          to="/"
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
            ${isActive('/') ? 'bg-gray-800 font-bold' : ''}
            ${isMinimized ? 'justify-center' : ''}`}
          title={isMinimized ? 'Home' : undefined}
        >
          <Home size={18} />
          {!isMinimized && 'Home'}
        </Link>

        {/* Manage Product */}
        <div className="relative">
          <button
            onClick={() => setProductsOpen(!productsOpen)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-800 transition
              ${isActive('/products') || isActive('/categories') || isActive('/brands') ? 'bg-gray-800 font-bold' : ''}
              ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? 'Manage Product' : undefined}
          >
            <div className="flex items-center gap-3">
              <Boxes size={18} />
              {!isMinimized && 'Manage Product'}
            </div>
            {!isMinimized && <ChevronDown size={16} className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`} />}
          </button>
          {productsOpen && !isMinimized && (
            <div className="ml-8 mt-2 flex flex-col gap-2 text-xs">
              <Link to="/products" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/products' ? 'font-semibold' : ''}`}>Product List</Link>
              <Link to="/products/create" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/products/create' ? 'font-semibold' : ''}`}>Create Product</Link>
              <Link to="/categories" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/categories' ? 'font-semibold' : ''}`}>Categories</Link>
              <Link to="/brands" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/brands' ? 'font-semibold' : ''}`}>Brands</Link>
              <Link to="/Unit" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/Unit' ? 'font-semibold' : ''}`}>Units</Link>
            </div>
          )}
        </div>

        {/* POS */}
        <Link
          to="/pos"
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
            ${isActive('/pos') ? 'bg-gray-800 font-bold' : ''}
            ${isMinimized ? 'justify-center' : ''}`}
          title={isMinimized ? 'POS' : undefined}
        >
          <CreditCard size={18} />
          {!isMinimized && 'POS'}
        </Link>

        {/* Purchases Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPurchasesOpen(!purchasesOpen)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-800 transition
              ${isActive('/purchases') ? 'bg-gray-800 font-bold' : ''}
              ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? 'Purchases' : undefined}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} />
              {!isMinimized && 'Purchases'}
            </div>
            {!isMinimized && <ChevronDown size={16} className={`transition-transform ${purchasesOpen ? 'rotate-180' : ''}`} />}
          </button>
          {purchasesOpen && !isMinimized && (
            <div className="ml-8 mt-2 flex flex-col gap-2 text-xs">
              <Link to="/purchases/create" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/purchases/create' ? 'font-semibold' : ''}`}>Create Purchase</Link>
            
              <Link
  to="/purchases"
  onClick={onLinkClick}
  className={`hover:underline ${location.pathname === '/purchases' ? 'font-semibold text-blue-600' : ''}`}
>
  Purchase Details
</Link>
            </div>
          )}
        </div>

        {/* Customers */}
        <Link
          to="/customers"
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
            ${isActive('/customers') ? 'bg-gray-800 font-bold' : ''}
            ${isMinimized ? 'justify-center' : ''}`}
          title={isMinimized ? 'Customers' : undefined}
        >
          <Users size={18} />
          {!isMinimized && 'Customers'}
        </Link>

        {/* Suppliers */}
        <Link
          to="/suppliers"
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
            ${isActive('/suppliers') ? 'bg-gray-800 font-bold' : ''}
            ${isMinimized ? 'justify-center' : ''}`}
          title={isMinimized ? 'Suppliers' : undefined}
        >
          <Users size={18} />
          {!isMinimized && 'Suppliers'}
        </Link>
        {/* Inventory */}
<Link
  to="/inventory"
  onClick={onLinkClick}
  className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
    ${isActive('/inventory') ? 'bg-gray-800 font-bold' : ''}
    ${isMinimized ? 'justify-center' : ''}`}
  title={isMinimized ? 'Inventory' : undefined}
>
  <FileText size={18} />
  {!isMinimized && 'Inventory'}
</Link>

       {/* Apply Discount */}
<Link
  to="/apply-discount"
  onClick={onLinkClick}
  className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
    ${isActive('/apply-discount') ? 'bg-gray-800 font-bold' : ''}
    ${isMinimized ? 'justify-center' : ''}`}
  title={isMinimized ? 'Apply Discount' : undefined}
>
  <DollarSign size={18} />
  {!isMinimized && 'Apply Discount'}
</Link>



        {/* Users */}
        <Link
          to="/users"
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition
            ${isActive('/users') ? 'bg-gray-800 font-bold' : ''}
            ${isMinimized ? 'justify-center' : ''}`}
          title={isMinimized ? 'Users' : undefined}
        >
          <Users size={18} />
          {!isMinimized && 'Users'}
        </Link>

        {/* Sales Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSalesOpen(!salesOpen)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-800 transition
              ${isActive('/sales') ? 'bg-gray-800 font-bold' : ''}
              ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? 'Sales' : undefined}
          >
            <div className="flex items-center gap-3">
              <ClipboardList size={18} />
              {!isMinimized && 'Sales'}
            </div>
            {!isMinimized && <ChevronDown size={16} className={`transition-transform ${salesOpen ? 'rotate-180' : ''}`} />}
          </button>
          {salesOpen && !isMinimized && (
            <div className="ml-8 mt-2 flex flex-col gap-2 text-xs">
              <Link to="/sales" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/sales' ? 'font-semibold' : ''}`}>Sales List</Link>
              <Link to="/sales/returns" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/sales/returns' ? 'font-semibold' : ''}`}>Sales Returns</Link>
            </div>
          )}
        </div>

      {/* Reports Dropdown */}
<div className="relative">
      <button
        onClick={() => setReportsOpen(!reportsOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-800 transition
          ${isActive('/reports') ? 'bg-gray-800 font-bold' : ''}
          ${isMinimized ? 'justify-center' : ''}`}
        title={isMinimized ? 'Reports' : undefined}
      >
        <div className="flex items-center gap-3">
          <FileBarChart2 size={18} />
          {!isMinimized && 'Reports'}
        </div>
        {!isMinimized && (
          <ChevronDown 
            size={16} 
            className={`transition-transform ${reportsOpen ? 'rotate-180' : ''}`}

          />
        )}
      </button>
      
      {reportsOpen && !isMinimized && (
        <div className="ml-8 mt-2 flex flex-col gap-2 text-xs">
          {/* Sales Report Link */}
          <Link 
            to="/reports/sales" 
            onClick={() => {
              onLinkClick();
              setReportsOpen(false);
            }}
            className={`hover:underline pl-2 ${
              isActive('/reports/sales') ? 'font-semibold text-blue-400' : ''
            }`}
          >
            Sales Report
          </Link>
          
          {/* Product Performance Link */}
          <Link 
            to="/reports/products" 
            onClick={() => {
              onLinkClick();
              setReportsOpen(false);
            }}
            className={`hover:underline pl-2 ${
              isActive('/reports/products') ? 'font-semibold text-blue-400' : ''
            }`}
          >
            Product Performance
          </Link>
          
          {/* Inventory Valuation Link */}
          <Link 
            to="/reports/inventory" 
            onClick={() => {
              onLinkClick();
              setReportsOpen(false);
            }}
            className={`hover:underline pl-2 ${
              isActive('/reports/inventory') ? 'font-semibold text-blue-400' : ''
            }`}
          >
            Inventory Valuation
          </Link>
          
          {/* Financial Reports Link */}
          <Link 
            to="/reports/financial" 
            onClick={() => {
              onLinkClick();
              setReportsOpen(false);
            }}
            className={`hover:underline pl-2 ${
              isActive('/reports/financial') ? 'font-semibold text-blue-400' : ''
            }`}
          >
            Financial Reports
          </Link>
          
          {/* Supplier Purchases Link */}
          <Link 
            to="/reports/suppliers" 
            onClick={() => {
              onLinkClick();
              setReportsOpen(false);
            }}
            className={`hover:underline pl-2 ${
              isActive('/reports/suppliers') ? 'font-semibold text-blue-400' : ''
            }`}
          >
            Supplier Purchases
          </Link>
        </div>
      )}
    </div>

        {/* Settings Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-800 transition
              ${isActive('/settings/business') ? 'bg-gray-800 font-bold' : ''}
              ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? 'Settings' : undefined}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              {!isMinimized && 'Settings'}
            </div>
            {!isMinimized && <ChevronDown size={16} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />}
          </button>
          {settingsOpen && !isMinimized && (
            <div className="ml-8 mt-2 flex flex-col gap-2 text-xs">
              <Link to="/settings/business/profile" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/settings/business/profile' ? 'font-semibold' : ''}`}>Business Profile</Link>
              <Link to="/settings/business/currency" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/settings/business/currency' ? 'font-semibold' : ''}`}>Currency Settings</Link>
              <Link to="/settings/business/roles" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/settings/business/roles' ? 'font-semibold' : ''}`}>Roles</Link>
              <Link to="/settings/business/roles-permissions" onClick={onLinkClick} className={`hover:underline ${location.pathname === '/settings/business/roles-permissions' ? 'font-semibold' : ''}`}>Roles & Permissions</Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}