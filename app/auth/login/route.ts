import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export function GET() {
  return NextResponse.redirect(new URL('/auth/signin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
