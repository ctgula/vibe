import { NextRequest, NextResponse } from 'next/server';
import { run } from '../scripts/add-theme-columns';

/**
 * API route to update the database schema
 * This adds missing columns required by the application
 */
export async function GET(req: NextRequest) {
  try {
    // Check for authentication
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      // If no API key is set, check if this is a development environment
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // In development, we'll log a warning but still allow the request
      console.warn('WARNING: Bypassing auth check in development mode. Set INTERNAL_API_KEY for security.');
    }
    
    // Run the schema update script
    const result = await run();
    
    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json(
      { error: 'Failed to update schema', details: String(error) },
      { status: 500 }
    );
  }
}
