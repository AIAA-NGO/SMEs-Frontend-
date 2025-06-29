// src/hooks/usePermissions.js
import { useState, useEffect } from 'react';
import { 
  getAvailablePermissions, 
  getPermissionCategories 
} from '../services/permissionServices';

const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setPermissions(getAvailablePermissions());
      setCategories(getPermissionCategories());
      setLoading(false);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  return { permissions, categories, loading };
};

export default usePermissions;