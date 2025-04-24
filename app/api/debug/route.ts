import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClientComponentClient();
    
    // Check connection to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (connectionError) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase connection failed',
        error: connectionError
      }, { status: 500 });
    }
    
    // Get schema information
    const { data: schemaInfo, error: schemaError } = await supabase.rpc('get_schema_info');
    
    // Get session info
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    return NextResponse.json({
      status: 'success',
      connection: 'connected',
      session: sessionError ? { error: sessionError } : sessionData,
      schema: schemaError ? { error: schemaError } : (schemaInfo || 'Schema RPC not available'),
      env: {
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Debug failed',
      error
    }, { status: 500 });
  }
}
