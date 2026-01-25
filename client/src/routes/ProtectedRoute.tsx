import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/auth/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    console.log('Authentication required, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  console.log('isAuthenticated', isAuthenticated);
  
  // Check single role
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ color: '#dc2626', margin: 0 }}>Access Denied</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>
          You don't have permission to access this page.
        </p>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
          Required role: {requiredRole}, Your role: {user?.role}
        </p>
      </div>
    );
  }
  
  // Check multiple roles
  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ color: '#dc2626', margin: 0 }}>Access Denied</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>
          You don't have permission to access this page.
        </p>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
          Required roles: {requiredRoles.join(', ')}, Your role: {user?.role}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

