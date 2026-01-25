import { Navigate } from 'react-router-dom';
import { useAuth } from '../pages/auth/AuthContext';

interface ConditionalRouteProps {
  children: React.ReactNode;
}

export default function ConditionalRoute({ children }: ConditionalRouteProps) {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    // Redirect EMPLOYEE users to their tracking jobs page
    if (user?.role === 'EMPLOYEE') {
      return <Navigate to="/employee/tracking-jobs" replace />;
    }
    // Redirect other authenticated users to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}
