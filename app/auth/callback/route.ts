import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/directory';
    
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code:', exchangeError);
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }

      // Get the session to confirm it worked
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Error getting session:', sessionError);
        return NextResponse.redirect(
          new URL('/auth/signin?error=Unable to get session', request.url)
        );
      }

      // Successful login - redirect to the next page or directory
      return NextResponse.redirect(new URL(next, request.url));
    }

    // No code found - redirect to sign in
    return NextResponse.redirect(new URL('/auth/signin?error=No auth code found', request.url));
  } catch (error) {
    console.error('Unexpected error in callback:', error);
    return NextResponse.redirect(
      new URL('/auth/signin?error=Unexpected error during authentication', request.url)
    );
  }
}
