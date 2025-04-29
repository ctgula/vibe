import { NextRequest, NextResponse } from 'next/server';

// Catchall route that will always return a 200 response
// Useful for diagnosing where errors are happening in the deployment

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Return diagnostic information
    return NextResponse.json({
      status: 'ok',
      message: 'Catchall API route responding successfully',
      path: pathname,
      query: Object.fromEntries(url.searchParams),
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || 'unknown'
    });
  } catch (error) {
    // Even if there's an error, still return a 200 response with error details
    return NextResponse.json({
      status: 'error_handled',
      message: 'Error in catchall route, but handling it gracefully',
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Use 200 even for errors to prevent cascading failures
  }
}

// Handle all HTTP methods
export { GET as POST, GET as PUT, GET as DELETE, GET as PATCH, GET as HEAD, GET as OPTIONS };
