import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    
    // Add an emergency debug route that bypasses all other middleware
    if (pathname === '/emergency-debug') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        url: req.url,
        headers: Object.fromEntries(req.headers),
        env: process.env.NODE_ENV || 'unknown'
      });
    }
    
    // Handle auth routes
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    if (pathname === '/signup') {
      return NextResponse.redirect(new URL('/auth/signup', req.url));
    }
    
    // Add redirects for deprecated routes
    if (pathname.startsWith('/rooms/') && !pathname.includes('[id]')) {
      return NextResponse.redirect(new URL(pathname.replace('/rooms/', '/room/'), req.url));
    }
    
    // Allow all API routes to proceed without additional middleware
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If this is an API route, return a JSON error
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Middleware error', message: String(error) },
        { status: 500 }
      );
    }
    
    // Otherwise continue to the app, which will show its own error UI
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
