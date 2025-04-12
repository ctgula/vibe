import { NextResponse } from 'next/server';

/**
 * Lists all tables in the Supabase project
 */
export async function GET() {
  try {
    // Forward the request to the MCP server
    const mcp_url = process.env.SUPABASE_MCP_URL || 'http://localhost:8000';
    const response = await fetch(`${mcp_url}/supabase/list_tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error listing tables:', error);
    return NextResponse.json(
      { error: 'Failed to list tables', details: String(error) },
      { status: 500 }
    );
  }
}
