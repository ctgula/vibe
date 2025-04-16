import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing in environment variables.');
}

const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

/**
 * Creates a new room in the Supabase database
 * @param req The incoming request with room details
 * @returns The created room data
 */
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase client could not be initialized. Check server environment variables.' },
      { status: 500 }
    );
  }

  try {
    // Get room details from the request body
    const roomData = await req.json();

    // Insert the room into the rooms table
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert([roomData])
      .select();

    if (error) {
      console.error('Supabase error creating room:', error);
      return NextResponse.json(
        { error: 'Failed to create room', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data && data[0] ? data[0] : {}, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room', details: String(error) },
      { status: 500 }
    );
  }
}
