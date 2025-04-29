import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

// Specify Node.js runtime for Vercel compatibility
export const runtime = 'nodejs';

// Define types for mock data to avoid TypeScript errors
interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  email: string;
  [key: string]: any; // Allow for dynamic property access
}

interface RoomData {
  id: string;
  room_name: string;
  created_by: string;
  is_private: boolean;
  [key: string]: any; // Allow for dynamic property access
}

interface SchemaData {
  name: string;
  tables: number;
  size: string;
}

interface TableData {
  name: string;
  schema: string;
  rows: string;
  size: string;
}

// Simplified API that doesn't use the problematic Supabase types
export async function POST(request: Request) {
  try {
    const { query, table, filter } = await request.json();
    
    // Try to use actual Supabase first if in production
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createServiceClient();
        
        if (query === 'select' && table) {
          // Use any type to avoid TypeScript deep instantiation errors
          let supabaseQuery: any = supabase.from(table).select('*');
          
          // Apply filters if provided
          if (filter && filter.column && filter.value) {
            supabaseQuery = supabaseQuery.eq(filter.column, filter.value);
          }
          
          // Apply limit if provided
          if (filter && filter.limit && typeof filter.limit === 'number') {
            supabaseQuery = supabaseQuery.limit(filter.limit);
          }
          
          const { data, error } = await supabaseQuery;
          
          if (error) throw error;
          
          return NextResponse.json({ 
            success: true, 
            data,
            source: 'supabase' 
          });
        }
      } catch (supabaseError) {
        console.warn('Error using Supabase, falling back to mock data:', supabaseError);
        // Continue to mock data as fallback
      }
    }
    
    // Use mock data as fallback or for development/testing
    console.log('Using mock data for query:', query, 'table:', table);
    let result;
    
    if (query === 'select') {
      // Simulate a DB query with mock data
      let mockData: (ProfileData | RoomData)[] = [];
      
      if (table === 'profiles') {
        mockData = [
          { id: '1', username: 'user1', display_name: 'User One', email: 'user1@example.com' },
          { id: '2', username: 'user2', display_name: 'User Two', email: 'user2@example.com' }
        ];
      } else if (table === 'rooms') {
        mockData = [
          { id: '101', room_name: 'Music Lounge', created_by: '1', is_private: false },
          { id: '102', room_name: 'Gaming Chat', created_by: '2', is_private: false }
        ];
      }
      
      // Apply mock filtering if requested
      if (filter && filter.column && filter.value) {
        mockData = mockData.filter(item => item[filter.column] === filter.value);
      }
      
      // Apply mock limit if requested
      if (filter && filter.limit && typeof filter.limit === 'number') {
        mockData = mockData.slice(0, filter.limit);
      }
      
      result = { success: true, data: mockData, source: 'mock' };
    }
    else if (query === 'schemas') {
      const schemaData: SchemaData[] = [
        { name: 'public', tables: 15, size: '12.5MB' },
        { name: 'auth', tables: 8, size: '4.2MB' },
        { name: 'storage', tables: 3, size: '0.8MB' }
      ];
      result = { success: true, data: schemaData, source: 'mock' };
    }
    else if (query === 'tables') {
      const tableData: TableData[] = [
        { name: 'profiles', schema: 'public', rows: '~500', size: '1.2MB' },
        { name: 'rooms', schema: 'public', rows: '~50', size: '0.3MB' },
        { name: 'room_participants', schema: 'public', rows: '~120', size: '0.4MB' },
        { name: 'messages', schema: 'public', rows: '~1000', size: '3.5MB' }
      ];
      result = { success: true, data: tableData, source: 'mock' };
    }
    else {
      result = { success: false, error: 'Unsupported query type', source: 'mock' };
    }
    
    return NextResponse.json(result);
  } 
  catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: String(error), source: 'error' },
      { status: 500 }
    );
  }
}
