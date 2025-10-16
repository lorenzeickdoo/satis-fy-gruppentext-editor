import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance, initializeMsal } from './services/auth';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import App from './App.tsx';
import './index.css';

// Initialize MSAL before rendering
const initializeAndRender = async () => {
  try {
    await initializeMsal();
    
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </MsalProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Fallback: render error message
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Initialisierungsfehler
          </h1>
          <p className="text-gray-600">
            Die Anwendung konnte nicht gestartet werden. Bitte laden Sie die Seite neu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }
};

initializeAndRender();
