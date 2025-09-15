# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Vite development server on http://localhost:5173
- `npm run build` - Build production bundle to `dist/` directory
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint to check code quality

## Architecture Overview

This is a React TypeScript application for the SATIS&FY Group Text Editor, designed to manage and edit group texts for job configurations.

### Core Functionality
The application fetches group text data from SATIS&FY API based on job numbers, allows editing of text content, and provides AI-powered text generation capabilities.

### Key Services

**API Integration (`src/services/api.ts`)**
- Fetches group text data from `https://api.satis-fy.com/api/v1/easyjob/grouptext/getGroupText`
- Updates group texts via PATCH requests
- Uses Bearer token authentication

**OpenAI Integration (`src/services/openai.ts`)**
- Generates text content using OpenAI's GPT-4.1-mini model
- Supports customizable settings (length, language)
- Handles bulk generation for multiple groups

**Supabase Integration (`src/services/supabase.ts`)**
- Stores AI text evaluation data for analytics
- Tracks user acceptance/rejection of generated texts

### Main Application Flow
1. User enters a job number to load group text data
2. Groups display with expandable sections showing text content and associated articles
3. Users can manually edit text or use AI tool to generate new content
4. AI tool supports single group or bulk generation with comparison views
5. Changes can be saved back to the API

### Microsoft SSO Implementation ✅
The application includes a complete Microsoft OAuth 2.0 single sign-on implementation with:
- **MSAL React Integration**: Full Microsoft Authentication Library integration with PKCE security
- **Group-based Authorization**: Validates user membership in specific Azure AD groups
- **Robust Error Handling**: Comprehensive error handling and token refresh mechanisms
- **Protected Routes**: Automatic login redirect for unauthorized users

**Authentication Flow:**
1. Users are redirected to Microsoft login page
2. After successful authentication, Azure AD validates group membership
3. Only authorized users (members of specified group) gain access
4. Tokens are managed automatically with silent refresh

**Key Components:**
- `src/services/auth.ts` - MSAL configuration and authentication functions
- `src/contexts/AuthContext.tsx` - Global authentication state management
- `src/components/auth/` - Login page, protected routes, and user profile components

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: Microsoft MSAL React
- **Icons**: Lucide React
- **Backend Services**: SATIS&FY API, OpenAI API, Supabase

## Environment Variables
The application uses Vite environment variables (see `.env.example`):
- **Microsoft Azure AD**: Client ID, Tenant ID, Group ID, Redirect URIs
- **API Credentials**: SATIS&FY API, OpenRouter API tokens
- **Supabase**: Database connection for analytics
- **Configuration**: App title, version, debug mode