# Microsoft SSO Implementation Plan - SATIS&FY Group Text Editor

## Überblick
Implementierung von Single Sign-On (SSO) mit Microsoft OAuth 2.0 für die SATIS&FY Group Text Editor Anwendung. Die Implementierung erfolgt als Custom OAuth Integration mit Microsoft Identity Platform.

## Benötigte Azure AD Konfiguration

### Azure Portal Setup (ERFORDERLICH VOR IMPLEMENTIERUNG)
1. **App Registration erstellen:**
   - Neuen Azure AD App registrieren
   - Eindeutigen Namen wählen (z.B. "SATIS&FY Group Text Editor")
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"

2. **Redirect URIs konfigurieren:**
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://ihre-domain.com/auth/callback`

3. **API Permissions:**
   - `openid` (für Basis-Authentifizierung)
   - `profile` (für Benutzerprofil)
   - `email` (für E-Mail-Adresse)
   - `User.Read` (für Microsoft Graph Benutzerdaten)

4. **Credentials:**
   - Client ID kopieren (wird in .env benötigt)
   - Optional: Client Secret generieren (für confidential flows)

### Benötigte Informationen vom Kunden
- [ ] Azure Tenant ID (oder "common" für multi-tenant)
- [ ] Gewünschte Benutzer-Berechtigung (nur bestimmte Domains/Organisationen?)
- [ ] Sollen alle Microsoft-Konten akzeptiert werden oder nur Firmen-Accounts?
- [ ] Wird Microsoft Graph API für erweiterte Benutzerdaten benötigt?

## Technische Implementierung

### 1. Dependencies
```bash
npm install @azure/msal-react @azure/msal-browser
```

### 2. Umgebungsvariablen
**Neue Variablen in `.env` und `.env.example`:**
```env
# Microsoft Azure AD Configuration
VITE_AZURE_CLIENT_ID=ihre-azure-app-client-id
VITE_AZURE_TENANT_ID=common
VITE_AZURE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/common
```

### 3. Datei-Struktur
```
src/
├── contexts/
│   └── AuthContext.tsx          # Global Authentication State
├── services/
│   ├── auth.ts                  # MSAL Configuration & Services
│   └── microsoft-graph.ts       # Optional: Microsoft Graph API
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx        # Login Interface
│   │   ├── ProtectedRoute.tsx   # Route Guards
│   │   └── UserProfile.tsx      # User Display Component
│   └── layout/
│       └── AuthLayout.tsx       # Layout für Auth-Flows
├── hooks/
│   └── useAuth.ts               # Authentication Hook
└── types/
    └── auth.ts                  # TypeScript Interfaces
```

## Implementierung-Phasen

### Phase 1: Basis-Authentifizierung
1. **MSAL Configuration Service** (`src/services/auth.ts`)
   - Microsoft Authentication Library Setup
   - Configuration für Azure AD App
   - Token Management Funktionen

2. **Authentication Context** (`src/contexts/AuthContext.tsx`)
   - Global State für Authentication Status
   - User Profile Management
   - Login/Logout Funktionen
   - Token Refresh Logic

3. **Authentication Hook** (`src/hooks/useAuth.ts`)
   - Wrapper für MSAL Funktionen
   - Simplified Interface für Components
   - Error Handling

### Phase 2: UI Integration
4. **Login Page** (`src/components/auth/LoginPage.tsx`)
   - Microsoft SSO Button
   - Loading States
   - Error Messages
   - Redirect Logic

5. **Protected Routes** (`src/components/auth/ProtectedRoute.tsx`)
   - Route Guards
   - Automatic Redirect zu Login
   - Loading während Authentication Check

6. **User Profile Component** (`src/components/auth/UserProfile.tsx`)
   - User Information Display
   - Logout Button
   - Profile Picture (optional)

### Phase 3: App Integration
7. **Main App Update** (`src/App.tsx`)
   - MSAL Provider Integration
   - Authentication Check beim App Start
   - Conditional Rendering basierend auf Auth Status

8. **Navigation Update**
   - Login/Logout Buttons in UI
   - User Profile in Header/Sidebar
   - Authentication Status Anzeige

### Phase 4: Token Management
9. **Silent Token Refresh**
   - Automatische Token Erneuerung
   - Background Token Acquisition
   - Error Handling für expired Tokens

10. **API Integration**
    - Access Token für SATIS&FY API Calls
    - Token Validation
    - Automatic Retry mit fresh Tokens

### Phase 5: Error Handling & Edge Cases
11. **Authentication Errors**
    - Network Errors
    - User Cancellation
    - Invalid Credentials
    - Expired Sessions

12. **Fallback Mechanisms**
    - Graceful Degradation
    - Error Recovery
    - User Feedback

## Sicherheitsüberlegungen

### Token Storage
- Access Tokens: In Memory (sicherer)
- Refresh Tokens: HTTP-only Cookies (wenn möglich)
- Session Storage für temporary Data

### PKCE (Proof Key for Code Exchange)
- Wird automatisch von MSAL verwendet
- Erhöht Sicherheit für public clients (SPA)

### Cross-Origin Requests
- CORS Configuration für Azure AD
- Proper Redirect URI Validation

## Testing Plan

### Unit Tests
- Authentication Service Functions
- Context Provider Logic
- Component Rendering States

### Integration Tests
- Complete OAuth Flow
- Token Refresh Scenarios
- Error Handling Paths

### Manual Tests
- Login/Logout Flow
- Token Expiration Handling
- Different User Types
- Browser Compatibility

## Migration Strategy

### Bestehende Benutzer
Da aktuell keine Authentifizierung implementiert ist:
- Neue SSO wird direkt aktiviert
- Keine Migration bestehender Accounts erforderlich

### Deployment
1. Azure AD App Registration
2. Environment Variables Configuration
3. Code Deployment
4. DNS/Redirect URI Update
5. Testing mit echten Microsoft Accounts

## Zeitschätzung
- **Phase 1-2:** 2-3 Entwicklungstage
- **Phase 3-4:** 1-2 Entwicklungstage  
- **Phase 5 & Testing:** 1-2 Entwicklungstage
- **Deployment & Configuration:** 1 Tag

**Gesamt: 5-8 Entwicklungstage**

## Offene Fragen für Stakeholder

1. **Azure AD Setup:** Wer erstellt die Azure AD App Registration?
2. **Benutzer-Berechtigung:** Sollen alle Microsoft-Konten akzeptiert werden oder nur bestimmte Organisationen?
3. **Fallback-Login:** Wird eine alternative Login-Methode benötigt?
4. **Benutzer-Rollen:** Gibt es verschiedene Benutzerrollen in der App?
5. **Microsoft Graph:** Werden erweiterte Benutzerdaten aus Microsoft Graph benötigt?
6. **Multi-Tenant:** Soll die App für mehrere Azure AD Tenants funktionieren?

## Nächste Schritte

1. ✅ Plan erstellt
2. ⏳ Klärung der offenen Fragen mit Stakeholdern
3. ⏳ Azure AD App Registration
4. ⏳ Client ID und Tenant ID erhalten
5. ⏳ Implementierung starten

---

**Hinweis:** Diese Implementierung ersetzt das bestehende Supabase Auth System komplett. Alle Authentifizierung erfolgt über Microsoft OAuth 2.0.