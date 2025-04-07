import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Log debugging info
    console.log('Webhook: handle-new-user called');
    
    // Parse the request body
    const requestData = await request.json();
    console.log('Webhook payload:', JSON.stringify(requestData));
    
    const { user } = requestData;
    
    // Validate user data
    if (!user || !user.id) {
      console.error('Invalid user data:', user);
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    // Ensure we have the required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables for Supabase');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create a Supabase client with service role key for admin privileges
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      console.log('Profile already exists for user:', user.id);
      return NextResponse.json({ message: 'Profile already exists' }, { status: 200 });
    }

    // Create username from email
    let username = '';
    if (user.email) {
      username = user.email.split('@')[0];
    } else {
      username = `user_${Math.floor(Math.random() * 1000000)}`;
    }

    // Add display name (fallback to username or metadata)
    const displayName = user.user_metadata?.display_name || 
                        user.user_metadata?.full_name || 
                        username;

    // Insert profile using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        username: username,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_guest: false,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Profile created successfully for user:', user.id);
    return NextResponse.json({ profile: data[0] }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in handle-new-user webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
