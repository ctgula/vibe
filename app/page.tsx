'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { user, guestId, createGuestSession } = useAuth();
  const touchStartRef = useRef<number | null>(null);

  // iOS/mobile optimizations: prevent double-tap zoom, enable haptics, handle safe areas
  useEffect(() => {
    // Prevent double-tap zoom on iOS
    const handleTouchEnd = (event: TouchEvent) => {
      const now = Date.now();
      if (touchStartRef.current && now - touchStartRef.current < 300) {
        event.preventDefault();
      }
      touchStartRef.current = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user || guestId) {
      router.push('/onboarding');
    }
  }, [user, guestId, router]);

  // Handle guest access
  const handleGuestAccess = async () => {
    try {
      if (!createGuestSession) {
        toast.error('System error. Please try again.');
        return;
      }
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([10, 5, 10]);
      await createGuestSession();
      router.push('/onboarding');
    } catch (error) {
      toast.error('Failed to create guest session');
    }
  };

  // Modern 2025 design: glassmorphism, big adaptive type, animated gradients, mobile-first, accessible colors
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] text-white px-4 py-safe-top pb-safe-bottom overflow-hidden"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Animated glass panel */}
      <motion.section
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.7, type: 'spring' }}
        className="w-full max-w-xl mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 flex flex-col items-center"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-300 drop-shadow-lg"
        >
          Vibe
        </motion.h1>
        <p className="mt-4 text-lg md:text-2xl text-zinc-200 font-medium text-center max-w-xl">
          Real-time voice rooms. Effortless connection. <span className="text-sky-400">No account required.</span>
        </p>
        <div className="flex flex-col gap-4 w-full mt-8">
          <Button
            onClick={handleGuestAccess}
            className="w-full py-4 rounded-2xl text-lg font-semibold bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 focus-visible:ring-4 focus-visible:ring-sky-300/60 transition-all shadow-lg"
            aria-label="Continue as Guest"
          >
            Continue as Guest
          </Button>
          <Link href="/auth/signup" className="block w-full">
            <Button
              variant="outline"
              className="w-full py-4 rounded-2xl text-lg font-semibold border-zinc-700 text-white bg-white/10 hover:bg-zinc-900/60 focus-visible:ring-4 focus-visible:ring-indigo-400/60 transition-all"
              aria-label="Create Account"
            >
              Create Account
            </Button>
          </Link>
          <Link href="/auth/login" className="block w-full text-center">
            <span className="inline-block text-base text-zinc-400 hover:text-white underline underline-offset-4 transition-colors focus-visible:outline-none">
              Already have an account? Log in
            </span>
          </Link>
        </div>
      </motion.section>
      {/* Subtle animated background blobs for 2025 flair */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl animate-pulse z-0"
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="absolute -bottom-40 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse z-0"
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror' }}
      />
      {/* iOS/mobile safe-area insets handled by py-safe-top pb-safe-bottom */}
    </motion.main>
  );
}
