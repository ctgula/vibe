import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check Supabase connection
    const { data: connectionCheck, error: connectionError } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });
    
    // Test authentication
    const { data: authSession, error: authError } = await supabase.auth.getSession();
    
    // Check environment variables
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing';
    
    // Get demo/testing account if exists
    const { data: demoUsers, error: demoError } = await supabase
      .from('profiles')
      .select('email')
      .eq('is_demo', true)
      .limit(1);
    
    return NextResponse.json({
      status: 'success',
      connection: connectionError ? { error: connectionError.message } : { success: true },
      auth: authError ? { error: authError.message } : { session: !!authSession.session },
      env: {
        url: publicUrl,
        anonKey: publicKey
      },
      demoAccount: demoUsers && demoUsers.length > 0 ? demoUsers[0].email : 'No demo account found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
