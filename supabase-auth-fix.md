# Supabase Authentication Fix Guide

## The Issue
We're experiencing a consistent "Invalid API key" error (401 unauthorized) when attempting to use Supabase authentication, even with hardcoded credentials.

## How to Fix

### 1. Check Supabase Project Status
1. Go to [Supabase Dashboard](https://app.supabase.io)
2. Ensure your project `ansqfdzcxwhqoloovotu` is active (not paused)
3. If paused, resume the project

### 2. Get Fresh API Keys
1. In your Supabase dashboard, select your project
2. Go to Project Settings → API
3. Copy the fresh URL (should still be `https://ansqfdzcxwhqoloovotu.supabase.co`)
4. Copy the fresh "anon public" key - this is likely different from what we've been using
5. Copy the fresh "service_role" key for server-side operations

### 3. Update Environment Variables
After getting fresh keys, update your `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=https://ansqfdzcxwhqoloovotu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-fresh-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-fresh-service-role-key]
```

### 4. Update any Hardcoded Keys
Search through the codebase for any hardcoded keys and update them:

```bash
cd /Users/ct/thick\ bi
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
```

Replace any found keys with the fresh ones.

### 5. Restart Development Server
```bash
npm run dev
```

### If All Else Fails
Consider creating a new Supabase project and migrating to it:

1. Create a new project in Supabase
2. Set up the same schema and database structure
3. Migrate your data if needed
4. Update all environment variables with the new project's credentials
