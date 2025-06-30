// src/context/AuthContext.js
import { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  fetchAllRoles,
  fetchRolePermissions,
  assignRolePermissions,
  fetchAllPermissions,
  getDefaultPermissionsForRole
} from '../services/permissionServices';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const rolePermissions = useMemo(() => ({
    ADMIN: [
      'dashboard_view',
      'product_view', 'product_create',
      'category_view', 'brand_view', 'unit_view',
      'pos_access', 'supplier_view', 'customer_view',
      'user_view', 'user_create', 'user_update',
      'purchase_view', 'purchase_create', 'purchase_update',
      'sale_view', 'sale_return', 'discount_apply',
      'reports_view', 'settings_manage',
      'role_manage', 'role_create',
      'inventory_view'
    ],
    MANAGER: [
      'dashboard_view',
      'category_view', 'product_view',
      'sale_view', 'sale_return',
      'purchase_view', 'inventory_view',
      'reports_view'
    ],
    CASHIER: [
      'dashboard_view',
      'customer_view', 'product_view',
      'sale_view', 'sale_return',
      'pos_access'
    ],
    RECEIVING_CLERK: [
      'product_view',
      'purchase_view', 'purchase_create',
      'purchase_update', 'inventory_view'
    ]
  }), []);

  const loadRolesAndPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        fetchAllRoles(),
        fetchAllPermissions()
      ]);
      setAllRoles(rolesData);
      setAllPermissions(permissionsData);
      setRolesLoaded(true);
    } catch (error) {
      console.error('Failed to load roles and permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPermissionsFromRoles = useCallback((roles) => {
    return roles.flatMap(role => rolePermissions[role] || []);
  }, [rolePermissions]);

  const hasPermission = useCallback((requiredPermission) => {
    if (!user) return false;
    return user.permissions?.includes(requiredPermission);
  }, [user]);

  const updateRolePermissions = useCallback(async (roleId, permissionNames) => {
    try {
      setLoading(true);
      await assignRolePermissions(roleId, permissionNames);
      if (user?.roles.some(role => role.id === roleId)) {
        const updatedPermissions = getPermissionsFromRoles(user.roles);
        setUser(prev => ({ ...prev, permissions: updatedPermissions }));
      }
      return true;
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, getPermissionsFromRoles]);

  const login = (authData) => {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('userName', authData.name || authData.username);
    const permissions = getPermissionsFromRoles(authData.roles);
    setUser({
      id: authData.id,
      username: authData.username,
      name: authData.name || authData.username,
      email: authData.email,
      roles: authData.roles,
      permissions,
      token: authData.token
    });
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setUser(null);
    setAllRoles([]);
    setAllPermissions([]);
    setRolesLoaded(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const roles = decoded.roles || [];
        const permissions = getPermissionsFromRoles(roles);
        setUser({
          id: decoded.id,
          username: decoded.sub,
          name: decoded.name || decoded.sub,
          email: decoded.email,
          roles,
          permissions,
          token
        });
        loadRolesAndPermissions();
      } catch (error) {
        logout();
      }
    }
  }, [getPermissionsFromRoles, logout, loadRolesAndPermissions]);

  const value = {
    user,
    allRoles,
    allPermissions,
    loading,
    rolesLoaded,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    updateRolePermissions,
    getDefaultPermissionsForRole,
    loadRolesAndPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};