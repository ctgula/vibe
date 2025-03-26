import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Attempt to create a test user
    const { data: userData, error: signupError } = await supabase.auth.signUp({
      email: 'test_user@example.com',
      password: 'password123',
    });

    if (signupError && signupError.message !== 'User already registered') {
      console.error('Auth bypass - signup error:', signupError.message);
      // Try to sign in anyway, maybe the user already exists
    }

    // Now attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test_user@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('Auth bypass - login error:', error.message);
      
      // Try admin override - this uses the admin-level credentials
      // Note: This is for debugging purposes only and should be removed in production
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: 'admin_bypass@example.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { is_admin: true }
      });

      if (adminError) {
        console.error('Admin override failed:', adminError.message);
        return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 401 });
      }
      
      // Try logging in with the admin account
      const { data: adminLoginData, error: adminLoginError } = await supabase.auth.signInWithPassword({
        email: 'admin_bypass@example.com',
        password: 'admin123',
      });
      
      if (adminLoginError) {
        console.error('Admin login failed:', adminLoginError.message);
        return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 401 });
      }
      
      // Create a profile for this user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: adminLoginData.user.id,
          username: 'Admin_User',
          avatar_url: null
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      return NextResponse.json({ 
        success: true, 
        user: adminLoginData.user,
        message: 'Created and logged in with admin bypass'
      });
    }

    // Log the successful authentication
    console.log('Auth bypass successful for test user');
    
    // Ensure profile exists
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          username: 'Test_User',
          avatar_url: null
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: 'Authentication bypass successful'
    });
  } catch (err) {
    console.error('Unexpected error in auth bypass:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during auth bypass' },
      { status: 500 }
    );
  }
}
