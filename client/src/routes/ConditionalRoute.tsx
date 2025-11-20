import { useAuth } from '../pages/auth/AuthContext';
import { Navigate } from 'react-router-dom';

interface ConditionalRouteProps {
  children: React.ReactNode;
}

export default function ConditionalRoute({ children }: ConditionalRouteProps) {
  const { isAuthenticated } = useAuth();
  // if (isAuthenticated) {
  //   return <Navigate to="/dashboard" replace />;
  // }
  return <>{children}</>;
}
