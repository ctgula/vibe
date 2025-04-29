import { createServerClient } from '@supabase/ssr';
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase-server';

// Convert from edge to node runtime for better Vercel compatibility
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const requestData = await request.json();
    const { user_id } = requestData;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Creating profile for user:', user_id);
    
    // Create a Supabase service client with admin privileges
    const supabase = createServiceClient();
    
    // Check if profile already exists to avoid duplicates
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing profile:', checkError);
      throw checkError;
    }
    
    // If profile already exists, return success but note it's an existing profile
    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        new_profile: false,
        profile_id: user_id
      });
    }
    
    // Create base profile data
    const profileData = {
      id: user_id,
      username: `user_${Date.now().toString(36)}`, // Generate a temporary username
      display_name: 'New User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      onboarded: false,
    };
    
    // Create the profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([profileData]);
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      throw insertError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      new_profile: true,
      profile_id: user_id
    });
  } catch (error) {
    console.error('Error in create-profile API:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
