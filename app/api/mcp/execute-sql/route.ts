import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
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
  
  // Check for potentially dangerous operations
  const hasDangerousOperations = [
    'DROP', 
    'TRUNCATE', 
    'ALTER', 
    'CREATE', 
    'GRANT', 
    'REVOKE',
    'VACUUM',
    'REINDEX',
    'CLUSTER'
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
    
    // Execute the query using Supabase's rpc function
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sql,
      params: params
    });
    
    if (error) {
      // If the rpc method fails, try a direct query as a last resort
      try {
        const { data: directData, error: directError } = await supabase.from('_raw_sql')
          .select()
          .rpc('execute', { sql, params });
          
        if (directError) throw directError;
        
        return NextResponse.json({ data: directData });
      } catch (directError) {
        return NextResponse.json(
          { error: error.message, details: error.details },
          { status: 500 }
        );
      }
    }
    
    // Log the successful query for auditing (in a real app, store this in a database)
    console.log(`SQL executed: ${sql}`);
    
    // Return the results
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error executing SQL:', error);
    return NextResponse.json(
      { error: 'Failed to execute SQL query', details: String(error) },
      { status: 500 }
    );
  }
}
