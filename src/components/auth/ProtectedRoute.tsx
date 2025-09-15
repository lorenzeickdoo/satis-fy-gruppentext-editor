import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoginPage from './LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Authentifizierung wird überprüft...
        </p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <LoginPage />;
  }

  // Show unauthorized message if user is not in the correct group
  if (user && !user.isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Zugriff verweigert
                </h3>
                <p className="text-sm text-red-700">
                  Sie sind nicht berechtigt, diese Anwendung zu verwenden. 
                  Bitte wenden Sie sich an Ihren Administrator.
                </p>
                <div className="mt-4">
                  <p className="text-xs text-red-600">
                    Angemeldet als: {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;