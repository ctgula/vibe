import { NextRequest, NextResponse } from 'next/server';
import { ensureProfileTriggers } from '../scripts/ensure-profiles';

// Set to Node.js runtime for better compatibility
export const runtime = 'nodejs';

/**
 * API endpoint to ensure automatic profile creation for users and guests
 */
export async function GET(req: NextRequest) {
  try {
    // In production, you might want to add authentication here
    // But for now, this will work in development mode
    
    console.log('Implementing auto-profile creation triggers...');
    const result = await ensureProfileTriggers();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ensure-profiles endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to implement profile triggers', details: String(error) },
      { status: 500 }
    );
  }
}
