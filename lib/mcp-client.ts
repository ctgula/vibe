/**
 * Client-side utility for interacting with the Supabase MCP server
 * through the Next.js API routes
 */

/**
 * Lists all tables in the Supabase project
 * @returns Array of table names
 */
export async function listTables() {
  try {
    const response = await fetch('/api/mcp/supabase/list-tables');
    if (!response.ok) {
      throw new Error(`Failed to list tables: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error listing tables:', error);
    throw error;
  }
}

/**
 * Interface for room creation parameters
 */
export interface CreateRoomParams {
  name: string;
  description?: string;
  created_by?: string | null;
  created_by_guest?: string | null;
  is_active?: boolean;
  is_public?: boolean;
  tags?: string[];
}

/**
 * Creates a new room in the Supabase database
 * @param roomData Room data to create
 * @returns The created room data
 */
export async function createRoom(roomData: CreateRoomParams) {
  try {
    const response = await fetch('/api/mcp/supabase/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

/**
 * Executes custom SQL on the Supabase database
 * @param sql SQL query to execute
 * @param params Parameters for the SQL query
 * @returns Query results
 */
export async function executeSQL(sql: string, params: any[] = []) {
  try {
    const response = await fetch('/api/mcp/supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'execute_sql',
        sql,
        params,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to execute SQL: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}
