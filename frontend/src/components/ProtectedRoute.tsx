import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUserRole } from '../lib/auth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const isAuth = isAuthenticated();
  const role = getCurrentUserRole();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <Outlet />;
}
