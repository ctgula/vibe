import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Generate a unique guest ID
    const guestId = `guest_${nanoid()}`;
    
    // Create a guest profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: guestId,
        username: `Guest_${nanoid(6)}`,
        is_guest: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating guest profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create guest profile' },
        { status: 500 }
      );
    }

    // Create a session for the guest
    const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
      email: `${guestId}@guest.local`,
      password: nanoid(), // Generate a random password
    });

    if (sessionError) {
      console.error('Error creating guest session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create guest session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      guest_id: guestId,
      access_token: session.session?.access_token,
      profile,
    });
  } catch (error) {
    console.error('Unexpected error in guest auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
