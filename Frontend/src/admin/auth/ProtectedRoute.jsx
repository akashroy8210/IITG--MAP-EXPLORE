import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    console.log('User is not authenticated. Redirecting to login page.');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
