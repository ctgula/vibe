'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Route } from 'next';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Finishing sign-in...');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorDesc = params.get('error_description');
        
        if (errorDesc) {
          setError(errorDesc);
          return;
        }
        
        if (code) {
          console.log('Found auth code, exchanging for session...');
          setMessage('Processing your sign-in...');
          
          // Exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            setError(exchangeError.message);
            return;
          }
          
          // Check if we have a session
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            setError(sessionError.message);
            return;
          }

          if (data?.session) {
            // User is logged in, redirect them
            console.log('Session found, redirecting');
            setMessage('Sign-in successful! Redirecting...');
            
            // Check if there's a redirect path stored in sessionStorage
            const redirectPath = sessionStorage.getItem('redirectAfterAuth');
            
            // Set flag for successful login
            sessionStorage.setItem('justLoggedIn', 'true');
            
            // Check if we have pending profile data from sign-up
            const pendingUsername = localStorage.getItem('pendingUsername');
            const pendingDisplayName = localStorage.getItem('pendingDisplayName');
            
            // If we have pending profile data, update the user's profile
            if (pendingUsername) {
              try {
                setMessage('Finalizing your account...');
                
                // Update the user's profile in the profiles table
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({
                    username: pendingUsername,
                    display_name: pendingDisplayName || pendingUsername,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', data.session.user.id);
                
                if (profileError) {
                  console.error('Error updating profile:', profileError);
                  // Don't fail the auth process if profile update fails
                }
                
                // Clear the pending profile data
                localStorage.removeItem('pendingUsername');
                localStorage.removeItem('pendingDisplayName');
              } catch (profileErr) {
                console.error('Error updating profile:', profileErr);
                // Don't fail the auth process if profile update fails
              }
            }
            
            // Clear any login-related flags
            sessionStorage.removeItem('redirectedToLogin');
            sessionStorage.removeItem('loggingIn');
            
            // Redirect to the stored path or default to home
            if (redirectPath) {
              sessionStorage.removeItem('redirectAfterAuth');
              router.push(redirectPath as Route);
            } else {
              router.push('/');
            }
          } else {
            setError('No session found after authentication');
          }
        } else {
          setError('No authentication code found in URL');
        }
      } catch (err: any) {
        console.error('Unexpected error in auth callback:', err);
        setError(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white p-4">
        <div className="flex flex-col items-center space-y-4 p-6 bg-red-900/20 border border-red-700/50 rounded-lg shadow-lg text-center max-w-md w-full backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">Authentication Issue</h2>
          <p className="text-red-300">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
            <button 
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors flex-1"
            >
              Return to Login
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors flex-1"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex flex-col items-center space-y-4 p-8 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md max-w-md w-full"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
        <p className="text-lg text-white">{message}</p>
        <p className="text-sm text-white/60">You'll be redirected automatically.</p>
        
        {message.includes('longer') && (
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Continue to App
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
