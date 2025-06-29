import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher';
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = "/login"
}: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If authenticated but no profile found, show error
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load user profile. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  // If role is required, check if user has the required role
  if (requiredRole) {
    const hasRequiredRole = requiredRole === 'admin' 
      ? userProfile.role === 'admin'
      : userProfile.role === 'admin' || userProfile.role === 'teacher';

    if (!hasRequiredRole) {
      return <Navigate to={fallbackPath} />;
    }
  }

  return <>{children}</>;
} 