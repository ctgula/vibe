import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase-server';

// Convert from edge to node runtime for better Vercel compatibility
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    
    // Log the event for debugging
    console.log('Webhook received:', payload.type);
    
    // Only process user.created events
    if (payload.type !== 'user.created') {
      return NextResponse.json({ 
        success: true, 
        message: 'Event type not handled by this webhook' 
      });
    }
    
    // Extract user data
    const user = payload.data;
    
    if (!user || !user.id) {
      return NextResponse.json({ 
        error: 'Invalid user data in webhook' 
      }, { status: 400 });
    }
    
    console.log('Creating profile for new user:', user.id);
    
    // Create Supabase client with service role
    const supabase = createServiceClient();
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing profile:', checkError);
      throw checkError;
    }
    
    // If profile already exists, return success
    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile_id: user.id
      });
    }
    
    // Create username from email or generate a random one
    let username = '';
    if (user.email) {
      username = user.email.split('@')[0];
    } else {
      username = `user_${Date.now().toString(36)}`;
    }
    
    // Get display name from metadata or use username
    const displayName = user.user_metadata?.full_name || username;
    
    // Create new profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        username: username,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_completed: false
      }]);
      
    if (insertError) {
      console.error('Error creating profile:', insertError);
      throw insertError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile_id: user.id
    });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
