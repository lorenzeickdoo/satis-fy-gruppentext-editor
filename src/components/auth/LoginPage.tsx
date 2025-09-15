import React, { useState } from 'react';
import { LogIn, Shield, AlertCircle, RefreshCw, Code } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { clearMsalState } from '../../services/auth';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, devBypass } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'redirect' | 'popup'>('redirect');
  const [isResetting, setIsResetting] = useState(false);
  
  // Check if development bypass is enabled
  const isDevBypassEnabled = import.meta.env.VITE_DEV_BYPASS_SSO === 'true';

  const handleLogin = async () => {
    try {
      await login(loginMethod === 'popup');
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by the AuthContext
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await clearMsalState();
      // Small delay to show feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDevBypass = () => {
    devBypass();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          SATIS&FY Group Text Editor
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Melden Sie sich mit Ihrem Microsoft-Konto an
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Anmeldung fehlgeschlagen
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Anmelde-Methode
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="redirect"
                    checked={loginMethod === 'redirect'}
                    onChange={(e) => setLoginMethod(e.target.value as 'redirect')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Redirect (Empfohlen)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="popup"
                    checked={loginMethod === 'popup'}
                    onChange={(e) => setLoginMethod(e.target.value as 'popup')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Popup-Fenster
                  </span>
                </label>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading || isResetting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn 
                    className={`h-5 w-5 text-blue-500 group-hover:text-blue-400 ${isLoading ? 'animate-spin' : ''}`} 
                    aria-hidden="true" 
                  />
                </span>
                {isLoading ? 'Anmeldung läuft...' : 'Mit Microsoft anmelden'}
              </button>

              {/* Reset Button - only show if there's an error */}
              {error && error.includes('läuft bereits') && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw 
                    className={`h-4 w-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} 
                    aria-hidden="true" 
                  />
                  {isResetting ? 'Zurücksetzen...' : 'Login-Status zurücksetzen'}
                </button>
              )}

              {/* Development Bypass Button - only show in development */}
              {isDevBypassEnabled && (
                <button
                  type="button"
                  onClick={handleDevBypass}
                  className="w-full flex justify-center py-2 px-4 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mt-3"
                >
                  <Code className="h-4 w-4 mr-2" aria-hidden="true" />
                  🚧 Development Bypass
                </button>
              )}
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Sicher und vertrauenswürdig
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-gray-500">
                Diese Anwendung verwendet Microsoft Azure Active Directory 
                für sichere Authentifizierung. Ihre Anmeldedaten werden 
                nicht auf unseren Servern gespeichert.
              </p>
              
              {/* Redirect URI Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="text-xs text-yellow-800">
                  <strong>Hinweis für Administrator:</strong><br />
                  Falls der Login fehlschlägt, muss die Redirect URI<br />
                  <code className="bg-yellow-100 px-1 rounded">http://localhost:5173/auth/callback</code><br />
                  in der Azure AD App Registration hinzugefügt werden.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;