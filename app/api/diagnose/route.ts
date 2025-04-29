import { NextResponse } from 'next/server';

// This API route provides detailed diagnostic info about environment variables
// while keeping sensitive information hidden

export async function GET() {
  try {
    // Check if critical environment variables are set
    const envStatus = {
      // Supabase variables (only report presence, not values)
      supabase: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      },
      
      // LiveKit variables
      livekit: {
        hasUrl: !!process.env.LIVEKIT_URL,
        hasApiKey: !!process.env.LIVEKIT_API_KEY,
        hasApiSecret: !!process.env.LIVEKIT_API_SECRET,
      },
      
      // Next.js environment info
      nextjs: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        vercelEnv: process.env.VERCEL_ENV || 'not set',
        isProduction: process.env.NODE_ENV === 'production',
        isVercel: !!process.env.VERCEL,
      },
      
      // Platform info
      platform: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
      },
      
      // Environment variable structure (safely represented)
      envKeys: Object.keys(process.env).filter(key => 
        !key.includes('KEY') && 
        !key.includes('SECRET') && 
        !key.includes('TOKEN') && 
        !key.includes('PASSWORD')
      ),
      
      // Other useful diagnostic info
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json({
      status: 'ok',
      environment: envStatus,
    });
  } catch (error) {
    // Return error in a safe way that won't cause cascading failures
    return NextResponse.json({
      status: 'error',
      error: String(error),
      errorType: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // Use 200 even for errors to prevent Vercel from showing its own error page
  }
}
