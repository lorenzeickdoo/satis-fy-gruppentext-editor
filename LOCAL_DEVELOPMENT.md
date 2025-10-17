# Local Development Guide

## Prerequisites

- Node.js 18+ installed
- npm installed
- `.env.local` file configured (see `.env.example`)

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual credentials:
   ```bash
   # Frontend variables (VITE_ prefix)
   VITE_AZURE_CLIENT_ID=your-azure-client-id
   VITE_AZURE_TENANT_ID=your-azure-tenant-id
   # ... etc

   # Backend variables (NO VITE_ prefix - for serverless functions)
   OPENROUTER_API_KEY=Bearer sk-or-v1-your-key
   API_BEARER_TOKEN=your-bearer-token
   ```

## Running Locally

### Option 1: Using Vercel CLI (Recommended)

This option properly runs the serverless functions locally.

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Run the development server:
   ```bash
   vercel dev
   ```

3. Open http://localhost:3000

**Why Vercel CLI?**
- Automatically runs serverless functions from `/api` folder
- Matches production environment exactly
- Properly handles environment variables (both VITE_ and non-VITE_)

### Option 2: Standard Vite Dev Server (Limited)

**Warning:** This option does NOT run the serverless functions. API calls to `/api/*` will fail.

```bash
npm run dev
```

Open http://localhost:5173

**Use this only for:**
- Frontend UI development
- Testing SSO login flow
- When you don't need API functionality

## Testing the API Routes

Once running with Vercel CLI, test the serverless functions:

### Test SATIS&FY API Proxy
```bash
curl http://localhost:3000/api/satis-fy/getGroupText/23-2160.10
```

### Test OpenRouter API Proxy
```bash
curl -X POST http://localhost:3000/api/openrouter \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

## Troubleshooting

### API calls fail with 404
- Make sure you're using `vercel dev` not `npm run dev`
- Check that `/api` folder exists with the serverless functions

### Environment variables not working
- Verify `.env.local` exists and has correct values
- Backend vars (no VITE_ prefix) only work in serverless functions
- Frontend vars (VITE_ prefix) are embedded during build

### Serverless function errors
- Check Vercel CLI console for error messages
- Verify `@vercel/node` is installed: `npm install --save-dev @vercel/node`
- Check that environment variables are set correctly

## Development Workflow

1. Make code changes
2. Vercel CLI auto-reloads
3. Test in browser at http://localhost:3000
4. Check console for errors

## Building for Production

```bash
npm run build
```

Test the production build locally:
```bash
npm run preview
```

**Note:** `npm run preview` also doesn't run serverless functions. Deploy to Vercel to test full production setup.
