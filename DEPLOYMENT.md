# Deployment Guide - SATIS&FY Group Text Editor

## 🚀 Vercel Deployment

### Prerequisites
- GitHub repository with the latest code
- Azure AD App Registration configured
- Environment variables ready

### Step 1: Vercel Setup
1. Connect your GitHub repository to Vercel
2. Select the repository: `grupentext-editor`
3. Configure deployment settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Environment Variables
Add these environment variables in Vercel Dashboard:

```bash
# Microsoft Azure AD Configuration
VITE_AZURE_CLIENT_ID=9c3ad78d-158d-4fea-b297-da26a3f162bf
VITE_AZURE_TENANT_ID=4f8651fc-44cc-49c6-83d1-ca55c5197f34
VITE_AZURE_REDIRECT_URI=https://your-app.vercel.app/auth/callback
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/4f8651fc-44cc-49c6-83d1-ca55c5197f34
VITE_AZURE_GROUP_ID=fd7e18ec-84f8-4ac8-ae9a-6e4c151a3834

# Supabase Configuration
VITE_SUPABASE_URL=https://nbwfboyjhggvbrnewsrb.supabase.co
VITE_SUPABASE_ANON_KEY=[supabase-key]

# OpenRouter API Configuration  
VITE_OPENROUTER_API_KEY=Bearer [api-key]

# API Configuration
VITE_API_BASE_URL=https://api.satis-fy.com/api/v1
VITE_API_BEARER_TOKEN=[bearer-token]

# App Configuration
VITE_APP_TITLE=SATIS&FY Group Text Editor
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
```

### Step 3: Azure AD Configuration
After deploying to Vercel, configure Azure AD App Registration:

CRITICAL: The app MUST be configured as a Single-Page Application (SPA), not as a Web app!

1. Go to Azure Portal → Azure Active Directory → App Registrations → [Your App]

2. Navigate to **Authentication** section

3. Under **Platform configurations**:
   - If you see a "Web" platform, click the three dots and **Remove** it
   - Click **Add a platform**
   - Select **Single-page application**
   - Add these Redirect URIs:
     - `https://satis-fy-gruppentext-editor.vercel.app`
     - `http://localhost:5173` (for local development)
   - Click **Configure**

4. Under **Implicit grant and hybrid flows**:
   - Uncheck all boxes (not needed for SPA with PKCE)

5. Navigate to **Token configuration** section

6. Add groups claim:
   - Click **Add groups claim**
   - Select **Security groups**
   - Check **Group ID** for **ID** tokens
   - Click **Add**

7. Save all changes

8. Important: Users must log out and log back in for group claims to take effect

### Step 4: Deploy
1. Push code to GitHub main branch
2. Vercel will automatically deploy
3. Test the production deployment

## 🔒 Security Checklist

- ✅ Environment variables configured in Vercel (not in code)
- ✅ Azure AD Redirect URI updated for production
- ✅ Group-based authorization active
- ✅ HTTPS enforced (automatic with Vercel)
- ✅ .env.local excluded from git

## 🧪 Post-Deployment Testing

1. **Authentication Flow**:
   - Visit production URL
   - Click "Mit Microsoft anmelden"
   - Complete Microsoft login
   - Verify group authorization

2. **Application Features**:
   - Test job number search
   - Verify group text loading
   - Test AI text generation
   - Confirm update functionality

## 🔄 CI/CD Pipeline

Vercel automatically:
- Builds on every push to main branch
- Runs preview deployments for pull requests
- Provides deployment status in GitHub

## 📞 Support

For deployment issues:
- Check Vercel deployment logs
- Verify environment variables
- Confirm Azure AD configuration
- Test authentication flow