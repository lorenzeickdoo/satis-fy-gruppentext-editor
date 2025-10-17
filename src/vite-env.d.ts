/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase (ANON key is designed for frontend use with RLS)
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  // Application settings
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string

  // Azure AD SSO configuration
  readonly VITE_AZURE_CLIENT_ID: string
  readonly VITE_AZURE_TENANT_ID: string
  readonly VITE_AZURE_REDIRECT_URI: string
  readonly VITE_AZURE_AUTHORITY: string
  readonly VITE_AZURE_GROUP_ID: string

  // Development
  readonly VITE_DEV_BYPASS_SSO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
