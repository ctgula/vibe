import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
  }
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    
    // If profile doesn't exist, create it
    if (!profile) {
      console.log('Profile not found, creating one');
      
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: id,
          username: `user_${Date.now().toString(36)}`,
          display_name: 'New User',
          bio: 'This profile was created by the force-profile endpoint',
          theme_color: '#6366f1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Created new profile',
        profile: createdProfile
      });
    }
    
    // Profile exists, return it
    return NextResponse.json({
      success: true,
      message: 'Profile found',
      profile
    });
    
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 });
  }
}
