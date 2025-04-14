import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a specialized endpoint just for creating the rooms policy
export async function POST(req: NextRequest) {
  try {
    console.log('Creating "Allow all test" policy on rooms table...');
    
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First check if the rooms table exists
    const { data: roomsCheck, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    console.log('Rooms table check:', roomsCheck ? 'exists' : 'not found', roomsError ? roomsError.message : '');
    
    // Create the policy
    try {
      // First try to drop the policy if it exists (to avoid duplicates)
      try {
        await supabase.rpc('execute', {
          sql: `DROP POLICY IF EXISTS "Allow all test" ON public.rooms;`,
          params: {}
        });
        console.log('Dropped existing policy if it existed');
      } catch (dropError) {
        console.log('No existing policy to drop or drop failed');
      }
      
      // Now create the policy
      const { data, error } = await supabase.rpc('execute', {
        sql: `CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);`,
        params: {}
      });
      
      if (error) throw error;
      
      console.log('Policy created successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Policy "Allow all test" created on rooms table',
        data 
      });
    } catch (policyError: any) {
      console.error('Error creating policy:', policyError);
      
      // Check if it's a "relation does not exist" error
      if (policyError.message && policyError.message.includes('relation "public.rooms" does not exist')) {
        // Create the rooms table first
        try {
          console.log('Creating rooms table...');
          
          const { error: tableError } = await supabase.rpc('execute', {
            sql: `
              CREATE TABLE IF NOT EXISTS public.rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_by UUID,
                is_active BOOLEAN DEFAULT TRUE
              );
            `,
            params: {}
          });
          
          if (tableError) throw tableError;
          
          // Now try to create the policy again
          console.log('Rooms table created, now creating policy...');
          
          const { data, error } = await supabase.rpc('execute', {
            sql: `CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);`,
            params: {}
          });
          
          if (error) throw error;
          
          console.log('Policy created successfully after creating table');
          return NextResponse.json({ 
            success: true, 
            message: 'Created rooms table and policy "Allow all test"',
            data 
          });
        } catch (tableError) {
          console.error('Error creating table:', tableError);
          return NextResponse.json(
            { error: 'Failed to create rooms table', details: String(tableError) },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create policy', details: String(policyError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
