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
    
    // SQL to create the room_peers table if it doesn't exist
    const { error } = await supabase
      .from('_migrations')
      .insert({
        name: 'create_room_peers_table',
        sql: `
          CREATE TABLE IF NOT EXISTS public.room_peers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
            peer_id TEXT NOT NULL,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(room_id, peer_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_room_peers_room_id ON public.room_peers(room_id);
        `
      });
    
    if (error) {
      console.error('SQL migration error:', error);
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Room peers table created or verified'
    });
  } catch (error) {
    console.error('Error creating room_peers table:', error);
    return NextResponse.json(
      { error: 'Failed to create room_peers table', details: String(error) },
      { status: 500 }
    );
  }
}
