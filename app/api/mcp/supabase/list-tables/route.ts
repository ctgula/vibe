import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin tasks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing in environment variables.');
  // Optionally throw an error or handle it gracefully depending on requirements
}

// Ensure client is created only if variables are present
const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

/**
 * Lists all tables in the 'public' schema of the Supabase project using the admin client.
 */
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase client could not be initialized. Check server environment variables.' },
      { status: 500 }
    );
  }

  try {
    // Query information_schema directly to get table names
    // Note: Supabase SDK v2 doesn't have a direct method for listing tables,
    // so we use a generic query approach if possible, or preferably RPC.
    // Let's try calling a hypothetical RPC function first (preferred).
    // Assumes a function `list_public_tables()` exists in your DB.
    // If not, you'd need to create it (see SQL below) or use a less direct query.
    
    /*
    Example SQL to create the function in Supabase SQL Editor:
    CREATE OR REPLACE FUNCTION list_public_tables()
    RETURNS TABLE(table_name text) AS $$
    BEGIN
      RETURN QUERY
      SELECT T.table_name::text
      FROM information_schema.tables T
      WHERE T.table_schema = 'public' AND T.table_type = 'BASE TABLE'
      ORDER BY T.table_name;
    END;
    $$ LANGUAGE plpgsql;
    */
    
    const { data, error } = await supabaseAdmin.rpc('list_public_tables');

    if (error) {
      console.error('Supabase RPC error listing tables:', error);
      // Fallback attempt: Query information_schema directly (less ideal with SDK)
      // This syntax might vary or not be directly supported for information_schema access.
      // It's generally better to use RPC for custom SQL.
      const { data: queryData, error: queryError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
        
      if (queryError) {
        console.error('Supabase direct query error listing tables:', queryError);
        throw new Error(`Failed to list tables: ${queryError.message}`);
      }
      console.log('Listed tables via direct query fallback');
      return NextResponse.json(queryData || []);
    }

    // Return the list of tables from RPC
    console.log('Listed tables via RPC');
    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Error listing tables:', error);
    return NextResponse.json(
      { error: 'Failed to list tables', details: String(error) },
      { status: 500 }
    );
  }
}
