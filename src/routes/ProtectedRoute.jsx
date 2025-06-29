import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const navigate = useNavigate();
  const { user, permissions } = useSelector(state => state.auth);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      toast.error('Please login to access this page');
      return;
    }

    if (requiredPermission && !permissions?.includes(requiredPermission)) {
      navigate('/');
      toast.error('You do not have permission to access this page');
    }
  }, [user, permissions, requiredPermission, navigate]);

  if (!user || (requiredPermission && !permissions?.includes(requiredPermission))) {
    return null;
  }

  return children;
};

export default ProtectedRoute;