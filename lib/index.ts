// Barrel file for lib exports
// This makes imports cleaner by allowing imports from '@/lib' instead of specific files

// Auth
export * from './auth';

// Supabase clients - using explicit re-exports to avoid naming conflicts
export { supabase } from './supabase';
export * from './supabaseClient';
export * from './supabaseServer';

// Utilities
export * from './utils';

// Performance monitoring
export * from './performance';

// MCP client
export * from './mcp-client';
