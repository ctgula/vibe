import { NextResponse } from 'next/server';

// This is a minimal API route with no dependencies that should always work
// Use this to test if deployment issues are related to specific code or dependencies

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Minimal API is working',
    timestamp: new Date().toISOString()
  });
}
