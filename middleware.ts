import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Add redirects for deprecated routes
  if (pathname.startsWith('/rooms/') && !pathname.includes('[id]')) {
    return NextResponse.redirect(new URL(pathname.replace('/rooms/', '/room/'), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
