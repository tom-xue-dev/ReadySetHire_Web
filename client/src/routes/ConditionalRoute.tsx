interface ConditionalRouteProps {
  children: React.ReactNode;
}

export default function ConditionalRoute({ children }: ConditionalRouteProps) {
  // Future: redirect authenticated users to dashboard
  // const { isAuthenticated } = useAuth();
  // if (isAuthenticated) {
  //   return <Navigate to="/dashboard" replace />;
  // }
  return <>{children}</>;
}
