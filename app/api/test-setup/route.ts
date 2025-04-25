import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check database connection
    const { data: connectionCheck, error: connectionError } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    // Create a demo user for testing (if it doesn't exist)
    const demoEmail = 'demo@example.com';
    const demoPassword = 'demo1234';
    
    // First check if demo user exists
    const { data: existingDemoAuth } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    let demoUserId = null;
    
    // If demo user doesn't exist in auth, create it
    // Look for the demo user in the returned users array
    const demoUser = existingDemoAuth?.users?.find(user => user.email === demoEmail);
    if (!demoUser) {
      const { data: newDemoUser, error: createDemoError } = await supabase.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
      });
      
      if (createDemoError) {
        console.error('Error creating demo user:', createDemoError);
      } else {
        demoUserId = newDemoUser.user.id;
        console.log('Created new demo user with ID:', demoUserId);
      }
    } else {
      demoUserId = demoUser.id;
      console.log('Found existing demo user with ID:', demoUserId);
    }
    
    // Make sure profile exists for the demo user
    if (demoUserId) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', demoUserId)
        .maybeSingle();
      
      if (!existingProfile) {
        // Create profile for demo user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: demoUserId,
            email: demoEmail,
            username: 'demo_user',
            display_name: 'Demo User',
            bio: 'This is a demo account for testing purposes.',
            theme_color: '#6366f1',
            is_demo: true,
            is_guest: false,
            onboarding_completed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (profileError) {
          console.error('Error creating profile for demo user:', profileError);
        } else {
          console.log('Created profile for demo user');
        }
      } else {
        console.log('Profile already exists for demo user');
      }
    }
    
    // Create a demo room if none exists
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    if (!rooms || rooms.length === 0) {
      const { error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: 'Welcome Room',
          description: 'A place to get started and meet other users',
          created_by: demoUserId,
          is_active: true,
          topics: ['general', 'welcome', 'music'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (roomError) {
        console.error('Error creating demo room:', roomError);
      } else {
        console.log('Created demo room');
      }
    } else {
      console.log('Room already exists');
    }
    
    // Return success with demo account info
    return NextResponse.json({
      success: true,
      message: 'Test setup complete. You can now test the app with the demo account.',
      demoAccount: {
        email: demoEmail,
        password: demoPassword
      },
      steps: [
        '1. Visit http://localhost:3002/auth/signin',
        '2. Sign in with demo@example.com / demo1234',
        '3. Complete onboarding if prompted',
        '4. You should be redirected to the rooms page',
        '5. Try creating or joining a room',
        '6. Click on your profile avatar to navigate to profile page'
      ]
    });
  } catch (error) {
    console.error('Test setup error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
