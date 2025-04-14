import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mcpUrl = process.env.SUPABASE_MCP_URL || 'http://localhost:8000';

// Whitelist of allowed operations for security
const ALLOWED_OPERATIONS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

// Check if a SQL query is potentially dangerous
function isSafeSql(sql: string): boolean {
  // Convert to uppercase for easier checking
  const upperSql = sql.toUpperCase();
  
  // Check if the query starts with an allowed operation
  const isAllowedOperation = ALLOWED_OPERATIONS.some(op => upperSql.trim().startsWith(op));
  
  // Special case for CREATE POLICY which is allowed
  if (upperSql.trim().startsWith('CREATE POLICY')) {
    return true;
  }
  
  // Check for potentially dangerous operations
  const hasDangerousOperations = [
    'DROP', 
    'TRUNCATE', 
    'ALTER', 
    'GRANT', 
    'REVOKE',
    'VACUUM',
    'REINDEX',
    'CLUSTER',
    'CREATE'
  ].some(op => upperSql.includes(op));
  
  return isAllowedOperation && !hasDangerousOperations;
}

/**
 * Securely executes SQL commands via the Supabase MCP server
 * This is for internal admin use only and requires authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Check for authentication
    // In a real app, you'd use getServerSession or similar to verify the user is an admin
    // For now, we'll use a simple API key check
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      // If no API key is set, check if this is a development environment
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // In development, we'll log a warning but still allow the request
      console.warn('WARNING: Bypassing auth check in development mode. Set INTERNAL_API_KEY for security.');
    }
    
    // Get the SQL query and parameters from the request
    const { sql, params = [] } = await req.json();
    
    if (!sql) {
      return NextResponse.json(
        { error: 'Missing SQL query' },
        { status: 400 }
      );
    }
    
    // Check if the SQL is potentially dangerous
    if (!isSafeSql(sql)) {
      return NextResponse.json(
        { error: 'Potentially dangerous SQL operation detected' },
        { status: 403 }
      );
    }
    
    // Try to use the MCP server if available
    try {
      const mcpResponse = await fetch(`${mcpUrl}/supabase/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });
      
      if (mcpResponse.ok) {
        const data = await mcpResponse.json();
        return NextResponse.json(data);
      }
      
      // If MCP server fails, fall back to direct Supabase client
      console.warn('MCP server failed, falling back to direct Supabase client');
    } catch (mcpError) {
      console.error('Error connecting to MCP server:', mcpError);
      // Continue to fallback
    }
    
    // Fallback: Use Supabase client directly
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Execute the query directly using Supabase's client
    try {
      // For CREATE POLICY statements, we need to use the service role key
      if (sql.trim().toUpperCase().startsWith('CREATE POLICY')) {
        console.log('Executing CREATE POLICY statement...');
        
        // Use the raw query method directly
        const { data: policyData, error: policyError } = await supabase
          .from('_dummy_table_for_policy_creation_')
          .select()
          .limit(1)
          .maybeSingle();
        
        // If we can't query, it's likely a permissions issue
        if (policyError && !policyError.message.includes('does not exist')) {
          console.error('Permission error:', policyError);
          return NextResponse.json(
            { error: 'Permission denied for SQL execution', details: policyError.message },
            { status: 403 }
          );
        }
        
        // Try to execute the policy creation directly
        try {
          // Create a temporary table to execute the policy on if needed
          if (sql.includes('public.rooms')) {
            console.log('Policy targets the rooms table');
            
            // Check if the rooms table exists
            const { data: roomsCheck, error: roomsError } = await supabase
              .from('rooms')
              .select('id')
              .limit(1);
              
            if (roomsError && roomsError.message.includes('does not exist')) {
              console.log('Creating rooms table for policy...');
              
              // Create the rooms table if it doesn't exist
              await supabase.rpc('execute', {
                sql: `
                  CREATE TABLE IF NOT EXISTS public.rooms (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    created_by UUID,
                    is_active BOOLEAN DEFAULT TRUE
                  );
                `,
                params: {}
              });
            }
          }
          
          // Execute the policy creation
          const { data: result, error: execError } = await supabase.rpc('execute', {
            sql: sql,
            params: params || {}
          });
          
          if (execError) throw execError;
          
          return NextResponse.json({ 
            data: result || { message: 'Policy created successfully' } 
          });
        } catch (policyExecError) {
          console.error('Policy execution error:', policyExecError);
          return NextResponse.json(
            { error: 'Failed to create policy', details: String(policyExecError) },
            { status: 500 }
          );
        }
      }
      
      // For other queries (SELECT, etc.)
      const { data: queryResult, error: queryError } = await supabase.rpc('execute', {
        sql: sql,
        params: params || {}
      });
      
      if (queryError) {
        throw queryError;
      }
      
      return NextResponse.json({ data: queryResult });
    } catch (directError) {
      console.error('SQL execution error:', directError);
      return NextResponse.json(
        { error: 'Failed to execute SQL', details: String(directError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
    return NextResponse.json(
      { error: 'Failed to execute SQL query', details: String(error) },
      { status: 500 }
    );
  }
}
