// app/auth/signin/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-supabase-auth'; // Use existing auth hook
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const { signInWithOAuth, isLoading } = useAuth(); // Use signInWithOAuth

  useEffect(() => {
    // Optional: Add any logic needed on page load, e.g., check if already logging in
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithOAuth('google'); // Call with 'google' provider
      // Supabase handles the redirect, no need to router.push here
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 p-8 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-zinc-400">Sign in to continue to Vibe</p>
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v3.2h5.59c-0.56,2.37-2.49,4.1-5.59,4.1c-3.2,0-5.8-2.6-5.8-5.8s2.6-5.8,5.8-5.8 c1.48,0,2.85,0.56,3.9,1.5L17.92,5.3C16.07,3.6,14.13,2.7,12,2.7c-4.97,0-9,4.03-9,9s4.03,9,9,9c5.25,0,8.72-3.69,8.72-8.88 C20.72,11.64,20.7,11.2,21.35,11.1z" fill="#4285F4"></path>
                <path d="M7.5,13.5c-0.73,0-1.4-0.28-1.9-0.73l-3.14,3.14C3.89,17.26,5.59,18,7.5,18c2.23,0,4.13-0.92,5.57-2.48L9.92,12.38 C9.27,13.07,8.43,13.5,7.5,13.5z" fill="#34A853"></path>
                <path d="M13.07,5.84L9.92,8.62C9.27,7.93,8.43,7.5,7.5,7.5c-1.91,0-3.61,0.74-4.89,2.13l3.14,3.14 C6.25,11.82,6.91,11.07,7.5,11.07c0.94,0,1.78,0.43,2.42,1.11l3.15-2.78C12.05,8.5,10.64,7.5,9,7.5C7.04,7.5,5.35,8.24,4.05,9.41 l3.14,3.14C8.28,11.14,9.5,10.5,11,10.5C11.8,10.5,12.57,10.67,13.07,5.84z" fill="#FBBC05"></path>
                <path d="M13.08,5.84L9.92,8.62c0.3,0.31,0.53,0.68,0.68,1.08L14.26,7.2C13.65,6.18,12.43,5.5,11,5.5 C9.5,5.5,8.28,6.14,7.28,7.28L10.5,10.5c0.94,0,1.78,0.43,2.42,1.11l3.15-2.78C14.75,7.69,13.32,5.84,13.08,5.84z" fill="#EA4335"></path>
              </g>
            </svg>
          )}
          Sign in with Google
        </button>
        {/* Add other sign-in options/links here if needed */}
      </div>
    </div>
  );
}
