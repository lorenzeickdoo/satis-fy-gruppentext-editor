import { 
  PublicClientApplication, 
  Configuration, 
  BrowserCacheLocation,
  LogLevel,
  InteractionRequiredAuthError,
  AuthenticationResult,
  AccountInfo,
  SilentRequest,
  RedirectRequest,
  PopupRequest
} from '@azure/msal-browser';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken, User } from '../types/auth';

// Validate environment variables
const validateConfig = () => {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
  const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
  
  if (!clientId) {
    throw new Error('VITE_AZURE_CLIENT_ID ist nicht konfiguriert');
  }
  if (!tenantId) {
    throw new Error('VITE_AZURE_TENANT_ID ist nicht konfiguriert');
  }
  
  return { clientId, tenantId };
};

// MSAL configuration
const createMsalConfig = (): Configuration => {
  const { clientId, tenantId } = validateConfig();
  
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin + '/auth/callback',
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage, // LocalStorage for better persistence
      storeAuthStateInCookie: true, // Set to true for IE11 or Edge support
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error('MSAL Error:', message);
              return;
            case LogLevel.Info:
              if (import.meta.env.VITE_DEBUG === 'true') {
                console.info('MSAL Info:', message);
              }
              return;
            case LogLevel.Verbose:
              if (import.meta.env.VITE_DEBUG === 'true') {
                console.debug('MSAL Debug:', message);
              }
              return;
            case LogLevel.Warning:
              console.warn('MSAL Warning:', message);
              return;
          }
        },
        piiLoggingEnabled: false
      }
    }
  };
};

// Create MSAL instance
let msalInstance: PublicClientApplication;

try {
  const msalConfig = createMsalConfig();
  msalInstance = new PublicClientApplication(msalConfig);
} catch (error) {
  console.error('Failed to create MSAL instance:', error);
  // Create a minimal fallback instance to prevent app crashes
  msalInstance = new PublicClientApplication({
    auth: {
      clientId: 'fallback-client-id',
      authority: 'https://login.microsoftonline.com/common'
    }
  });
}

export { msalInstance };

// Initialize MSAL
export const initializeMsal = async (): Promise<void> => {
  try {
    // Check if we have a valid configuration first
    validateConfig();
    
    await msalInstance.initialize();
    
    // Handle redirect promise - this can fail if redirect URI is not configured
    try {
      const response = await msalInstance.handleRedirectPromise();
      if (response && response.account) {
        msalInstance.setActiveAccount(response.account);
      }
    } catch (redirectError: any) {
      console.warn('Redirect handling failed (this is expected if redirect URI is not configured):', redirectError);
      
      // Check for specific MSAL errors that indicate redirect URI issues
      if (redirectError?.errorCode === 'no_token_request_cache_error' || 
          redirectError?.message?.includes('no_token_request_cache_error') ||
          redirectError?.message?.includes('redirect_uri')) {
        console.warn('Redirect URI is likely not configured in Azure AD App Registration');
        // Don't throw here - let the app continue to show login page
      } else {
        // Re-throw other redirect errors
        throw redirectError;
      }
    }
    
    console.log('MSAL initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MSAL:', error);
    
    // Create more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('VITE_AZURE_CLIENT_ID')) {
        throw new Error('Azure Client ID ist nicht konfiguriert. Bitte überprüfen Sie die .env.local Datei.');
      }
      if (error.message.includes('VITE_AZURE_TENANT_ID')) {
        throw new Error('Azure Tenant ID ist nicht konfiguriert. Bitte überprüfen Sie die .env.local Datei.');
      }
      if (error.message?.includes('redirect_uri') || error.message?.includes('AADSTS50011')) {
        throw new Error('Redirect URI ist nicht konfiguriert. Der Kunde muss http://localhost:5173/auth/callback in der Azure AD App Registration hinzufügen.');
      }
    }
    
    throw new Error('Microsoft Authentication konnte nicht initialisiert werden. Bitte überprüfen Sie die Konfiguration.');
  }
};

// Scopes for Microsoft Graph API
export const loginRequest: PopupRequest | RedirectRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account', // Always show account selection
};

// Get access token silently
export const getAccessTokenSilently = async (): Promise<string | null> => {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length === 0) {
    return null;
  }

  const request: SilentRequest = {
    scopes: loginRequest.scopes,
    account: accounts[0],
    forceRefresh: false
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Silent token acquisition failed, interaction required
      console.warn('Silent token acquisition failed, user interaction required');
      // You might want to trigger interactive login here
      return null;
    }
    console.error('Error acquiring token silently:', error);
    throw error;
  }
};

// Decode and validate token with group check
export const decodeAndValidateToken = (idToken: string): User | null => {
  try {
    const decodedToken = jwtDecode<DecodedToken>(idToken);
    
    // Check if user is in the authorized group
    const authorizedGroupId = import.meta.env.VITE_AZURE_GROUP_ID;
    const isAuthorized = decodedToken.groups ? 
      decodedToken.groups.includes(authorizedGroupId) : 
      false;

    if (!isAuthorized) {
      console.warn('User is not in the authorized group');
    }

    return {
      id: decodedToken.oid,
      email: decodedToken.preferred_username || decodedToken.email || '',
      name: decodedToken.name,
      givenName: decodedToken.given_name,
      surname: decodedToken.family_name,
      jobTitle: decodedToken.jobTitle,
      groups: decodedToken.groups,
      isAuthorized
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// Login with redirect
export const loginWithRedirect = async (): Promise<void> => {
  try {
    await msalInstance.loginRedirect(loginRequest);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Login with popup
export const loginWithPopup = async (): Promise<AuthenticationResult> => {
  try {
    // Check if there's already an interaction in progress
    const inProgress = msalInstance.getActiveAccount();
    if (inProgress) {
      console.log('Using existing active account');
    }
    
    const response = await msalInstance.loginPopup(loginRequest);
    if (response.account) {
      msalInstance.setActiveAccount(response.account);
    }
    return response;
  } catch (error: any) {
    console.error('Login failed:', error);
    
    // Handle specific interaction_in_progress error
    if (error.errorCode === 'interaction_in_progress') {
      console.warn('Login interaction already in progress. Clearing state and retrying...');
      // Clear any pending interactions
      try {
        await msalInstance.clearCache();
      } catch (clearError) {
        console.warn('Failed to clear cache:', clearError);
      }
      throw new Error('Ein Login-Prozess läuft bereits. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
    }
    
    throw error;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await msalInstance.logoutRedirect({
        account: accounts[0],
        postLogoutRedirectUri: window.location.origin
      });
    }
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length === 0) {
    return null;
  }

  const account = accounts[0];
  
  // Try to get user from cached ID token
  const idTokenClaims = account.idTokenClaims as DecodedToken | undefined;
  
  if (!idTokenClaims) {
    return null;
  }

  // Check if user is in the authorized group
  const authorizedGroupId = import.meta.env.VITE_AZURE_GROUP_ID;
  const isAuthorized = idTokenClaims.groups ? 
    idTokenClaims.groups.includes(authorizedGroupId) : 
    false;

  return {
    id: account.homeAccountId,
    email: account.username,
    name: account.name || '',
    givenName: idTokenClaims.given_name,
    surname: idTokenClaims.family_name,
    jobTitle: idTokenClaims.jobTitle,
    groups: idTokenClaims.groups,
    isAuthorized
  };
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return msalInstance.getAllAccounts().length > 0;
};

// Get active account
export const getActiveAccount = (): AccountInfo | null => {
  return msalInstance.getActiveAccount();
};

// Set active account
export const setActiveAccount = (account: AccountInfo): void => {
  msalInstance.setActiveAccount(account);
};

// Clear MSAL cache and reset state
export const clearMsalState = async (): Promise<void> => {
  try {
    await msalInstance.clearCache();
    console.log('MSAL cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear MSAL cache:', error);
  }
};

// Handle authentication errors
export const handleAuthError = (error: any): string => {
  if (error.errorCode) {
    switch (error.errorCode) {
      case 'user_cancelled':
        return 'Anmeldung wurde abgebrochen';
      case 'login_required':
        return 'Bitte melden Sie sich an';
      case 'consent_required':
        return 'Zusätzliche Berechtigungen erforderlich';
      case 'interaction_in_progress':
        return 'Anmeldung läuft bereits. Bitte laden Sie die Seite neu.';
      case 'popup_window_error':
        return 'Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite';
      case 'token_renewal_error':
        return 'Token konnte nicht erneuert werden. Bitte melden Sie sich erneut an';
      default:
        return error.errorMessage || 'Ein Fehler ist aufgetreten';
    }
  }
  return 'Ein unbekannter Fehler ist aufgetreten';
};