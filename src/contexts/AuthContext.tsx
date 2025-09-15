import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { 
  loginWithPopup, 
  loginWithRedirect, 
  logout as msalLogout,
  getCurrentUser,
  getAccessTokenSilently,
  handleAuthError,
  decodeAndValidateToken
} from '../services/auth';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (usePopup?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  devBypass: () => void;
}

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
  refreshUser: async () => {},
  devBypass: () => {}
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, inProgress, accounts } = useMsal();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null
  });

  // Check and update authentication state
  const checkAuthState = useCallback(() => {
    try {
      if (inProgress === InteractionStatus.None) {
        const user = getCurrentUser();
        
        if (user) {
          // Check if user is authorized (in the correct group)
          if (!user.isAuthorized) {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: 'Sie sind nicht berechtigt, diese Anwendung zu verwenden. Bitte wenden Sie sich an Ihren Administrator.'
            });
          } else {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user,
              error: null
            });
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Fehler beim Überprüfen des Authentifizierungsstatus'
      });
    }
  }, [inProgress]);

  // Effect to check auth state when interaction status or accounts change
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState, accounts, inProgress]);

  // Login function
  const login = useCallback(async (usePopup = false) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (usePopup) {
        const response = await loginWithPopup();
        
        // Validate the token and check group membership
        if (response.idToken) {
          const user = decodeAndValidateToken(response.idToken);
          
          if (user) {
            if (!user.isAuthorized) {
              throw new Error('Sie sind nicht berechtigt, diese Anwendung zu verwenden.');
            }
            
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user,
              error: null
            });
          } else {
            throw new Error('Token-Validierung fehlgeschlagen');
          }
        }
      } else {
        await loginWithRedirect();
        // Redirect will happen, no need to update state here
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: errorMessage
      });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await msalLogout();
      // State will be updated after redirect
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Get access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAccessTokenSilently();
      
      if (!token && authState.isAuthenticated) {
        // Token expired, try interactive login
        await login(true);
        return await getAccessTokenSilently();
      }
      
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }, [authState.isAuthenticated, login]);

  // Refresh user information
  const refreshUser = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = getCurrentUser();
      
      if (user) {
        if (!user.isAuthorized) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: 'Sie sind nicht berechtigt, diese Anwendung zu verwenden.'
          });
        } else {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            error: null
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Fehler beim Aktualisieren der Benutzerdaten'
      }));
    }
  }, []);

  // Development bypass function
  const devBypass = useCallback(() => {
    if (import.meta.env.VITE_DEV_BYPASS_SSO === 'true') {
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'developer@satis-fy.com',
        name: 'Development User',
        givenName: 'Development',
        surname: 'User',
        jobTitle: 'Developer',
        groups: [import.meta.env.VITE_AZURE_GROUP_ID],
        isAuthorized: true
      };

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        error: null
      });

      console.log('🚧 Development bypass activated - Mock user logged in');
    } else {
      console.warn('Development bypass is disabled in production');
    }
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    getAccessToken,
    refreshUser,
    devBypass
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};