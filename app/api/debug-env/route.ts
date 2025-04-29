import { NextResponse } from 'next/server';

// Specify Node.js runtime for Vercel compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check for critical environment variables
    const envStatus = {
      // Supabase variables
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // LiveKit variables
      hasLivekitUrl: !!process.env.LIVEKIT_URL,
      hasLivekitApiKey: !!process.env.LIVEKIT_API_KEY,
      hasLivekitApiSecret: !!process.env.LIVEKIT_API_SECRET,
      
      // Next.js environment info
      nodeEnv: process.env.NODE_ENV || 'not set',
      vercelEnv: process.env.VERCEL_ENV || 'not set',
      
      // Server runtime
      serverRuntime: 'nodejs',
      
      // Safety: Don't return actual values, just whether they exist
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      status: 'ok',
      environment: envStatus
    });
  } catch (error) {
    console.error('Error checking environment:', error);
    return NextResponse.json(
      { error: 'Failed to check environment', details: String(error) },
      { status: 500 }
    );
  }
}
