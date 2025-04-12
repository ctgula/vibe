import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a new room in the Supabase database
 * @param req The incoming request with room details
 * @returns The created room data
 */
export async function POST(req: NextRequest) {
  try {
    // Get room details from the request body
    const roomData = await req.json();
    
    // Forward the request to the MCP server
    const mcp_url = process.env.SUPABASE_MCP_URL || 'http://localhost:8000';
    const response = await fetch(`${mcp_url}/supabase/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          INSERT INTO rooms (
            name,
            description,
            created_by,
            created_by_guest,
            is_active,
            is_public,
            tags
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7
          )
          RETURNING *;
        `,
        params: [
          roomData.name,
          roomData.description || null,
          roomData.created_by || null,
          roomData.created_by_guest || null,
          roomData.is_active !== undefined ? roomData.is_active : true,
          roomData.is_public !== undefined ? roomData.is_public : true,
          roomData.tags || null
        ]
      }),
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room', details: String(error) },
      { status: 500 }
    );
  }
}
