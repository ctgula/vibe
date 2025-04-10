'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGuestSession } from '@/hooks/useGuestSession';
import { Loader2, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateCreativeGuestName } from '@/lib/utils';

export default function GuestPage() {
  const [nickname, setNickname] = useState('');
  const [joinAsGuest, setJoinAsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { guestId, isLoading: guestLoading, createGuestSession } = useGuestSession();
  const router = useRouter();

  // Generate a creative nickname when the component loads
  useEffect(() => {
    setNickname(generateCreativeGuestName());
  }, []);

  // If the user already has a guest session, redirect to directory
  useEffect(() => {
    // Set a flag to indicate we're in the login process
    sessionStorage.setItem('loggingIn', 'true');
    
    if (guestId && !guestLoading) {
      // Clear login flags and redirect
      sessionStorage.removeItem('loggingIn');
      sessionStorage.removeItem('redirectedToLogin');
      router.replace('/');
    }
    
    return () => {
      // Clean up the flag when component unmounts if we didn't complete login
      if (!guestId) {
        sessionStorage.removeItem('loggingIn');
      }
    };
  }, [guestId, guestLoading, router]);

  const handleContinueAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await createGuestSession();
      
      // Set session flags to indicate successful login
      sessionStorage.setItem('justLoggedIn', 'true');
      sessionStorage.removeItem('redirectedToLogin');
      
      // Redirect to the main page
      router.replace('/');
    } catch (err: any) {
      console.error('Error in guest login:', err);
      setError('Failed to create guest profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (guestLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-zinc-400">Setting up your guest profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full p-6 rounded-2xl bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Join as Guest</h1>
          <p className="text-zinc-400 mt-2">No account needed to start exploring</p>
        </div>

        <motion.form
          onSubmit={handleContinueAsGuest}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-2">
            <label htmlFor="nickname" className="text-sm text-zinc-400">
              Your display name
            </label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-zinc-500 italic">
              This is how others will see you in rooms
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              <span>Continue as Guest</span>
            </Button>
          </motion.div>
        </motion.form>

        <div className="mt-8 text-center">
          <p className="text-zinc-400 text-sm mb-4">
            Want to create an account instead?
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full py-5 border-zinc-700 hover:bg-zinc-800 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Sign in or Create Account</span>
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
