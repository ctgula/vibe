'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/auth/sign-in-form';
import { useAuth } from '@/contexts/AuthProvider';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [view, setView] = useState<'options' | 'password' | 'magic-link'>('options');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  // Use type assertion to ensure TypeScript doesn't complain during build
  const auth = useAuth() as any;
  const signInWithGoogle = auth.signInWithGoogle;
  const signInWithMagicLink = auth.signInWithMagicLink;

  // Set a flag to indicate we're in the login process
  useEffect(() => {
    sessionStorage.setItem('loggingIn', 'true');
    
    // If we're already authenticated, redirect to the main page
    if (localStorage.getItem('guestProfileId')) {
      router.replace('/');
    }
    
    return () => {
      // Clean up the flag when component unmounts
      sessionStorage.removeItem('loggingIn');
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    setMessage('Connecting to Google...');
    
    try {
      // Store the timestamp when the sign-in was initiated
      sessionStorage.setItem('signInStartTime', Date.now().toString());
      
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign-in error:', error);
        setError(error.message || 'Failed to sign in with Google');
        setMessage('');
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      setError(err.message || 'An error occurred');
      setMessage('');
    } finally {
      // Google sign-in is redirecting us, so we need to stop showing
      // the loading state after a timeout in case there's a redirect lag
      setTimeout(() => {
        if (sessionStorage.getItem('signInStartTime')) {
          setIsLoading(false);
          setMessage('Redirection is taking longer than expected. You may need to try again.');
        }
      }, 5000);
      
      // Only stop loading if we hit an error
      // For successful redirects, keep the loading state
      if (error) {
        setIsLoading(false);
      }
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setMessage('Magic link sent! Check your email inbox.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full p-6 rounded-2xl bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome to Vibe</h1>
          <p className="text-zinc-400 mt-2">Sign in to join the conversation</p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-6 bg-white hover:bg-gray-100 text-gray-900 font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12v3.2h5.59c-0.56,2.37-2.49,4.1-5.59,4.1c-3.2,0-5.8-2.6-5.8-5.8s2.6-5.8,5.8-5.8 c1.48,0,2.85,0.56,3.9,1.5L17.92,5.3C16.07,3.6,14.13,2.7,12,2.7c-4.97,0-9,4.03-9,9s4.03,9,9,9c5.25,0,8.72-3.69,8.72-8.88 C20.72,11.64,20.7,11.2,21.35,11.1z" fill="#4285F4"></path>
                        <path d="M7.5,13.5c-0.73,0-1.4-0.28-1.9-0.73l-3.14,3.14C3.89,17.26,5.59,18,7.5,18c2.23,0,4.13-0.92,5.57-2.48L9.92,12.38 C9.27,13.07,8.43,13.5,7.5,13.5z" fill="#34A853"></path>
                        <path d="M13.07,5.84L9.92,8.62C9.27,7.93,8.43,7.5,7.5,7.5c-1.91,0-3.61,0.74-4.89,2.13l3.14,3.14 C6.25,11.82,6.91,11.07,7.5,11.07c0.94,0,1.78,0.43,2.42,1.11l3.15-2.78C12.05,8.5,10.64,7.5,9,7.5C7.04,7.5,5.35,8.24,4.05,9.41 l3.14,3.14C8.28,11.14,9.5,10.5,11,10.5C11.8,10.5,12.57,10.67,13.07,5.84z" fill="#FBBC05"></path>
                        <path d="M13.08,5.84L9.92,8.62c0.3,0.31,0.53,0.68,0.68,1.08L14.26,7.2C13.65,6.18,12.43,5.5,11,5.5 C9.5,5.5,8.28,6.14,7.28,7.28L10.5,10.5c0.94,0,1.78,0.43,2.42,1.11l3.15-2.78C14.75,7.69,13.32,5.84,13.08,5.84z" fill="#EA4335"></path>
                      </g>
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </Button>
              </motion.div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-zinc-900 text-zinc-400">Or</span>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={() => setView('password')}
                  className="w-full flex items-center justify-center gap-2 py-6 bg-zinc-800 hover:bg-zinc-700"
                >
                  <span>Continue with Email and Password</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={() => setView('magic-link')}
                  className="w-full flex items-center justify-center gap-2 py-6 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Mail className="w-4 h-4" />
                  <span>Continue with Magic Link</span>
                </Button>
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-400 text-sm text-center mt-4"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {view === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SignInForm />

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setView('options')}
                  className="text-zinc-400 hover:text-zinc-300 text-sm"
                >
                  Go back to sign in options
                </button>
              </div>
            </motion.div>
          )}

          {view === 'magic-link' && (
            <motion.div
              key="magic-link"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500 py-6"
                    disabled={isLoading}
                    required
                  />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending magic link...
                      </>
                    ) : (
                      'Send Magic Link'
                    )}
                  </Button>
                </motion.div>

                {message && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-green-400 text-sm text-center p-2 bg-green-500/10 rounded-md"
                  >
                    {message}
                  </motion.p>
                )}

                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-400 text-sm text-center mt-4"
                  >
                    {error}
                  </motion.p>
                )}
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setView('options')}
                  className="text-zinc-400 hover:text-zinc-300 text-sm"
                >
                  Go back to sign in options
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-zinc-400 text-sm">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
