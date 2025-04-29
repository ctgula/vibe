import { NextResponse } from 'next/server';

// Simplest possible API route with absolute minimum dependencies
export async function GET() {
  try {
    // Return basic health info
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'unknown',
      runtime: 'default' // Will use the default Next.js runtime
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
