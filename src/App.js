// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './redux/store';
import DashboardLayout from "./layouts/DashboardLayout";
import Signin from "./pages/auth/Signin";
import SignUp from './pages/auth/Signup';
import CategoriesPage from './pages/Categories/CategoriesPage';
import BrandsPage from './pages/Brands/BrandsPage';
import UnitsPage from "./pages/Unit/UnitsPage";
import CreateProduct from './pages/products/CreateProduct';
import Cart from "./pages/Cart/cart";
import Reports from "./pages/Sales reports/reports";
import SuppliersPage from './pages/suppliers/SuppliersPage';
import CustomersPage from './pages/Customers/CustomersPage';
import ProductPage from './pages/products/ProductPage';
import AdminDashboardControl from "./pages/dashboard/AdminDashboardControl";
import PosPage from "./pages/Pos/PosPage";
import NotFound from "./pages/NotFound"; 
import UsersList from './pages/Users/UsersList';
import CreateUser from './pages/Users/CreateUser';
import EditUser from './pages/Users/EditUser';
import UserChangePassword from './pages/Users/UserChangePassword';
import { AuthProvider } from './context/AuthContext';
import SalesList from "./pages/sales/SalesList";
import SalesHistory from "./pages/sales/SalesHistory";
import SalesReturnPage from './pages/sales/SalesReturnPage';
import CreatePurchase from './pages/Purchase/CreatePurchase';
import TrackPurchase from './pages/Purchase/TrackPurchase';
import PurchaseDetails from './pages/Purchase/PurchaseDetails';
import BusinessProfile from './pages/settings/business/BusinessProfile';
import CurrencySettings from './pages/settings/business/CurrencySettings';
import Roles from './pages/settings/business/Roles';
import CreateRole from './pages/settings/business/CreateRole';
import RolesPermissions from './pages/settings/business/RolesPermissions';
import InventoryPage from './pages/inventory/InventoryPage';
import EditPurchase from './pages/Purchase/EditPurchase';
import ApplyDiscount from './pages/Discount/ApplyDiscount';
import SalesReport from './pages/reports/SalesReport';
import ProductPerformanceReport from './pages/reports/ProductPerformanceReport';
import InventoryValuationReport from './pages/reports/InventoryValuationReport';
import FinancialReports from './pages/reports/FinancialReports';
import SupplierPurchasesReport from './pages/reports/SupplierPurchasesReport';


function App() {
  return (
    <Provider store={store}>
      <AuthProvider> 
        <Router>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard/admin" replace />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/Users/create" element={<CreateUser />} />
                <Route path="/Users/edit/:id" element={<EditUser />} />
                <Route path="/Users/change-password/:id" element={<UserChangePassword />} />
                <Route path="/sales/history" element={<SalesHistory />} />
               
                <Route path="/sales/returns/create" element={<SalesReturnPage />} />
                <Route path="/purchases/edit/:id" element={<EditPurchase />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/dashboard/admin" element={<DashboardLayout><AdminDashboardControl/></DashboardLayout>} />
                <Route path="/products" element={<DashboardLayout><ProductPage /></DashboardLayout>} />
                <Route path="/products/create" element={<DashboardLayout><CreateProduct /></DashboardLayout>} />
                <Route path="/categories" element={<DashboardLayout><CategoriesPage /></DashboardLayout>} />
                <Route path="/brands" element={<DashboardLayout><BrandsPage /></DashboardLayout>} />
                <Route path="/Unit" element={<DashboardLayout><UnitsPage /></DashboardLayout>} />
                <Route path="/pos" element={<DashboardLayout><PosPage /></DashboardLayout>} />
                <Route path="/cart" element={<DashboardLayout><Cart /></DashboardLayout>} />
                <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
                <Route path="/suppliers/*" element={<DashboardLayout><SuppliersPage /></DashboardLayout>} />
                <Route path="/customers" element={<DashboardLayout><CustomersPage /></DashboardLayout>} />
                <Route path="/users" element={<DashboardLayout>{<UsersList />}</DashboardLayout>} />
                <Route path="/inventory" element={<DashboardLayout><InventoryPage /></DashboardLayout>}/>
                <Route path="/purchases/create" element={<DashboardLayout><CreatePurchase /></DashboardLayout>} />
                <Route path="/purchases/track" element={<DashboardLayout><TrackPurchase /></DashboardLayout>} />
                <Route  path="/purchases"element={<DashboardLayout><PurchaseDetails /></DashboardLayout>} />
                <Route path="/sales" element={<DashboardLayout><SalesList /></DashboardLayout>} />
                <Route path="/sales/returns" element={<DashboardLayout><SalesReturnPage /></DashboardLayout>} />
                <Route path="/apply-discount" element={<DashboardLayout><ApplyDiscount /></DashboardLayout>} />
                 
                {/* Report Routes */}
                <Route path="/reports/sales" element={<DashboardLayout><SalesReport /></DashboardLayout>} />
                <Route path="/reports/products" element={<DashboardLayout><ProductPerformanceReport /></DashboardLayout>} />
                <Route path="/reports/inventory" element={<DashboardLayout><InventoryValuationReport /></DashboardLayout>} />
                <Route path="/reports/financial" element={<DashboardLayout><FinancialReports /></DashboardLayout>} />
                <Route path="/reports/suppliers" element={<DashboardLayout><SupplierPurchasesReport /></DashboardLayout>} />
 
                <Route path="/settings/business/profile" element={<DashboardLayout><BusinessProfile /></DashboardLayout>} />
                <Route path="/settings/business/currency" element={<DashboardLayout><CurrencySettings /></DashboardLayout>} />
                <Route path="/settings/business/roles" element={<DashboardLayout><Roles /></DashboardLayout>} />
                <Route path="/roles/create" element={<DashboardLayout><CreateRole /></DashboardLayout>} />
                <Route path="/settings/business/roles-permissions" element={<DashboardLayout><RolesPermissions /></DashboardLayout>} />
              </Routes>
            </div>
            
          </div>
        </Router>
      </AuthProvider> 
    </Provider>
  );
}

export default App;