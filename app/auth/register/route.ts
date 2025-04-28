import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.redirect(new URL('/auth/signup', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
