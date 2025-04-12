import { NextRequest, NextResponse } from 'next/server';

/**
 * Forwards requests to the Supabase MCP server
 * @param req The incoming request
 * @returns Response from the MCP server
 */
export async function POST(req: NextRequest) {
  try {
    // Get the endpoint from the request
    const { endpoint, ...body } = await req.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    // Forward the request to the MCP server
    // Default MCP server port is 8000
    const mcp_url = process.env.SUPABASE_MCP_URL || 'http://localhost:8000';
    const response = await fetch(`${mcp_url}/supabase/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error forwarding request to MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests to list available endpoints
 */
export async function GET() {
  return NextResponse.json({
    available_endpoints: [
      'list_tables',
      'execute_sql',
      'create_room',
      'list_rooms',
      'get_room',
      'update_room',
      'delete_room',
    ],
    usage: 'POST to this endpoint with { "endpoint": "endpoint_name", ...params }',
  });
}
