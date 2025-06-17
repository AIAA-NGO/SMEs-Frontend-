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
  ChevronRight,
  PackageCheck,
  ListChecks
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Sidebar({
  isMobileOpen,
  isMinimized,
  onLinkClick,
  onToggleMinimize
}) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Dropdown states
  const [productsOpen, setProductsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);

  useEffect(() => {
    if (isMinimized || !isMobileOpen) {
      setProductsOpen(false);
      setReportsOpen(false);
      setSalesOpen(false);
      setSettingsOpen(false);
      setPurchasesOpen(false);
    }
  }, [isMinimized, isMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onLinkClick}
        />
      )}

      <aside 
        className={`
          fixed top-0 left-0 h-full z-50
          bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 shadow-xl
          overflow-y-auto transition-all duration-300 ease-in-out
          ${isMobile ? (isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full') : 'translate-x-0'}
          ${isMinimized ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Logo & Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {(!isMinimized || isMobile) && (
              <span className="text-xl font-bold select-none bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                InventoryPro
              </span>
            )}
          </div>
          <button
            onClick={onToggleMinimize}
            className="hidden md:inline-flex p-1.5 rounded-lg hover:bg-gray-700 transition-all"
            aria-label={isMinimized ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isMinimized ? (
              <ChevronRight size={20} className="text-gray-300" />
            ) : (
              <ChevronLeft size={20} className="text-gray-300" />
            )}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 p-2 mt-2 select-none">
          {/* Home */}
          <Link
            to="/"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'Home' : undefined}
          >
            <Home size={20} className={`${isActive('/') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">Home</span>}
          </Link>

          {/* Manage Product */}
          <div className="relative">
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className={`flex items-center justify-between w-full px-4 py-4 rounded-lg transition-all
                ${isActive('/products') || isActive('/categories') || isActive('/brands') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
                ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
              title={isMinimized && !isMobile ? 'Manage Product' : undefined}
            >
              <div className="flex items-center gap-3">
                <Boxes size={20} className={`${isActive('/products') || isActive('/categories') || isActive('/brands') ? 'text-blue-400' : 'text-gray-300'}`} />
                {(!isMinimized || isMobile) && <span className="font-medium">Manage Product</span>}
              </div>
              {(!isMinimized || isMobile) && (
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${productsOpen ? 'rotate-180' : ''} text-gray-400`}
                />
              )}
            </button>
            {(productsOpen && (!isMinimized || isMobile)) && (
              <div className="ml-10 mt-2 flex flex-col gap-1 pl-2 border-l border-gray-700">
                {[
                  { path: '/products', label: 'Product List', icon: <Boxes size={14} /> },
                  { path: '/products/create', label: 'Create Product', icon: <Boxes size={14} /> },
                  { path: '/categories', label: 'Categories', icon: <Boxes size={14} /> },
                  { path: '/brands', label: 'Brands', icon: <Boxes size={14} /> },
                  { path: '/Unit', label: 'Units', icon: <Boxes size={14} /> }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={onLinkClick} 
                    className={`flex items-center gap-2 py-3 px-3 rounded-md text-sm transition-colors
                      ${location.pathname === item.path ? 'text-blue-400 font-medium bg-blue-900/20' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* POS */}
          <Link
            to="/pos"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/pos') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'POS' : undefined}
          >
            <CreditCard size={20} className={`${isActive('/pos') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">POS</span>}
          </Link>

          {/* Purchases Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPurchasesOpen(!purchasesOpen)}
              className={`flex items-center justify-between w-full px-4 py-4 rounded-lg transition-all
                ${isActive('/purchases') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
                ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
              title={isMinimized && !isMobile ? 'Purchases' : undefined}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className={`${isActive('/purchases') ? 'text-blue-400' : 'text-gray-300'}`} />
                {(!isMinimized || isMobile) && <span className="font-medium">Purchases</span>}
              </div>
              {(!isMinimized || isMobile) && (
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${purchasesOpen ? 'rotate-180' : ''} text-gray-400`}
                />
              )}
            </button>
            {(purchasesOpen && (!isMinimized || isMobile)) && (
              <div className="ml-10 mt-2 flex flex-col gap-1 pl-2 border-l border-gray-700">
                {[
                  { path: '/purchases/create', label: 'Create Purchase', icon: <ShoppingCart size={14} /> },
                  { path: '/purchases', label: 'Purchase List', icon: <ListChecks size={14} /> },
                  { path: '/purchases/track', label: 'Receive Purchases', icon: <PackageCheck size={14} /> }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={onLinkClick} 
                    className={`flex items-center gap-2 py-3 px-3 rounded-md text-sm transition-colors
                      ${location.pathname === item.path ? 'text-blue-400 font-medium bg-blue-900/20' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Customers */}
          <Link
            to="/customers"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/customers') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'Customers' : undefined}
          >
            <Users size={20} className={`${isActive('/customers') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">Customers</span>}
          </Link>

          {/* Suppliers */}
          <Link
            to="/suppliers"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/suppliers') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'Suppliers' : undefined}
          >
            <Users size={20} className={`${isActive('/suppliers') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">Suppliers</span>}
          </Link>

          {/* Inventory */}
          <Link
            to="/inventory"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/inventory') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'Inventory' : undefined}
          >
            <FileText size={20} className={`${isActive('/inventory') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">Inventory</span>}
          </Link>

          {/* Apply Discount */}
          <Link
            to="/apply-discount"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/apply-discount') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'Apply Discount' : undefined}
          >
            <DollarSign size={20} className={`${isActive('/apply-discount') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">Apply Discount</span>}
          </Link>

          {/* Users */}
          <Link
            to="/users"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all
              ${isActive('/users') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
              ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
            title={isMinimized && !isMobile ? 'Users' : undefined}
          >
            <Users size={20} className={`${isActive('/users') ? 'text-blue-400' : 'text-gray-300'}`} />
            {(!isMinimized || isMobile) && <span className="font-medium">Users</span>}
          </Link>

          {/* Sales Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className={`flex items-center justify-between w-full px-4 py-4 rounded-lg transition-all
                ${isActive('/sales') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
                ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
              title={isMinimized && !isMobile ? 'Sales' : undefined}
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={20} className={`${isActive('/sales') ? 'text-blue-400' : 'text-gray-300'}`} />
                {(!isMinimized || isMobile) && <span className="font-medium">Sales</span>}
              </div>
              {(!isMinimized || isMobile) && (
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${salesOpen ? 'rotate-180' : ''} text-gray-400`}
                />
              )}
            </button>
            {(salesOpen && (!isMinimized || isMobile)) && (
              <div className="ml-10 mt-2 flex flex-col gap-1 pl-2 border-l border-gray-700">
                {[
                  { path: '/sales', label: 'Sales List', icon: <ClipboardList size={14} /> },
                  { path: '/sales/returns', label: 'Sales Returns', icon: <ClipboardList size={14} /> }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={onLinkClick} 
                    className={`flex items-center gap-2 py-3 px-3 rounded-md text-sm transition-colors
                      ${location.pathname === item.path ? 'text-blue-400 font-medium bg-blue-900/20' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reports Dropdown */}
          <div className="relative">
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className={`flex items-center justify-between w-full px-4 py-4 rounded-lg transition-all
                ${isActive('/reports') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
                ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
              title={isMinimized && !isMobile ? 'Reports' : undefined}
            >
              <div className="flex items-center gap-3">
                <FileBarChart2 size={20} className={`${isActive('/reports') ? 'text-blue-400' : 'text-gray-300'}`} />
                {(!isMinimized || isMobile) && <span className="font-medium">Reports</span>}
              </div>
              {(!isMinimized || isMobile) && (
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${reportsOpen ? 'rotate-180' : ''} text-gray-400`}
                />
              )}
            </button>
            {(reportsOpen && (!isMinimized || isMobile)) && (
              <div className="ml-10 mt-2 flex flex-col gap-1 pl-2 border-l border-gray-700">
                {[
                  { path: '/reports/sales', label: 'Sales Report', icon: <FileBarChart2 size={14} /> },
                  { path: '/reports/products', label: 'Product Performance', icon: <FileBarChart2 size={14} /> },
                  { path: '/reports/inventory', label: 'Inventory Valuation', icon: <FileBarChart2 size={14} /> },
                  { path: '/reports/financial', label: 'Financial Reports', icon: <FileBarChart2 size={14} /> },
                  { path: '/reports/suppliers', label: 'Supplier Purchases', icon: <FileBarChart2 size={14} /> }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={() => {
                      onLinkClick();
                      setReportsOpen(false);
                    }}
                    className={`flex items-center gap-2 py-3 px-3 rounded-md text-sm transition-colors
                      ${isActive(item.path) ? 'text-blue-400 font-medium bg-blue-900/20' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`flex items-center justify-between w-full px-4 py-4 rounded-lg transition-all
                ${isActive('/settings/business') ? 'bg-blue-900/30 text-white border-l-4 border-blue-500' : 'hover:bg-gray-700/50'}
                ${isMinimized && !isMobile ? 'justify-center px-2' : ''}`}
              title={isMinimized && !isMobile ? 'Settings' : undefined}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className={`${isActive('/settings/business') ? 'text-blue-400' : 'text-gray-300'}`} />
                {(!isMinimized || isMobile) && <span className="font-medium">Settings</span>}
              </div>
              {(!isMinimized || isMobile) && (
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${settingsOpen ? 'rotate-180' : ''} text-gray-400`}
                />
              )}
            </button>
            {(settingsOpen && (!isMinimized || isMobile)) && (
              <div className="ml-10 mt-2 flex flex-col gap-1 pl-2 border-l border-gray-700">
                {[
                  { path: '/settings/business/profile', label: 'Business Profile', icon: <Settings size={14} /> },
                  { path: '/settings/business/currency', label: 'Currency Settings', icon: <Settings size={14} /> },
                  { path: '/settings/business/roles', label: 'Roles', icon: <Settings size={14} /> },
                  { path: '/settings/business/roles-permissions', label: 'Roles & Permissions', icon: <Settings size={14} /> }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={onLinkClick} 
                    className={`flex items-center gap-2 py-3 px-3 rounded-md text-sm transition-colors
                      ${location.pathname === item.path ? 'text-blue-400 font-medium bg-blue-900/20' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}