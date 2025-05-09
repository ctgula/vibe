import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Environment variables with fallback to project reference
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ansqfdzcxwhqoloovotu.supabase.co';

// IMPORTANT: NEVER hardcode API keys - this should come from environment variables
// You need to properly set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for direct interactions
// This bypasses the typical Next.js environment variable loading
export const supabaseDirect = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
