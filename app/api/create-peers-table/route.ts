import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Add nodejs runtime for better Vercel compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Create a Supabase client with admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use direct SQL query instead of _migrations table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.room_peers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
          peer_id TEXT NOT NULL,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(room_id, peer_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_room_peers_room_id ON public.room_peers(room_id);
        
        -- Enable Row Level Security
        ALTER TABLE public.room_peers ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (tableError) {
      console.error('Table creation error:', tableError);
      throw tableError;
    }

    // Create policies in separate queries to avoid errors if they already exist
    // Policy 1: Anyone can view room peers
    const { error: policy1Error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'room_peers' AND policyname = 'Anyone can view room peers'
          ) THEN
            CREATE POLICY "Anyone can view room peers" 
              ON public.room_peers 
              FOR SELECT 
              USING (true);
          END IF;
        END
        $$;
      `
    });
    
    if (policy1Error) console.error('Policy 1 error:', policy1Error);

    // Policy 2: Authenticated users can insert their own peers
    const { error: policy2Error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'room_peers' AND policyname = 'Authenticated users can insert their own peers'
          ) THEN
            CREATE POLICY "Authenticated users can insert their own peers" 
              ON public.room_peers 
              FOR INSERT 
              TO authenticated
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM public.rooms
                  WHERE id = room_id
                )
              );
          END IF;
        END
        $$;
      `
    });
    
    if (policy2Error) console.error('Policy 2 error:', policy2Error);

    // Policy 3: Authenticated users can delete their own peers
    const { error: policy3Error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'room_peers' AND policyname = 'Authenticated users can delete their own peers'
          ) THEN
            CREATE POLICY "Authenticated users can delete their own peers" 
              ON public.room_peers 
              FOR DELETE 
              TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM public.rooms
                  WHERE id = room_id
                )
              );
          END IF;
        END
        $$;
      `
    });
    
    if (policy3Error) console.error('Policy 3 error:', policy3Error);
    
    return NextResponse.json({
      success: true,
      message: 'Room peers table created or verified with RLS policies'
    });
  } catch (error) {
    console.error('Error creating room_peers table:', error);
    return NextResponse.json(
      { error: 'Failed to create room_peers table', details: String(error) },
      { status: 500 }
    );
  }
}
