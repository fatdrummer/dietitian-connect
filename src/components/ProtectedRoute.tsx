import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import type { AppRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'dietitian' ? '/dietitian' : '/client'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
