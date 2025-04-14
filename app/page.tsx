'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/auth";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { user, guestId, createGuestSession } = useAuth();

  // Handle guest access
  const handleGuestAccess = async () => {
    try {
      if (!createGuestSession) {
        toast.error('System error. Please try again.');
        return;
      }
      
      await createGuestSession();
      router.push('/onboarding');
    } catch (error) {
      toast.error('Failed to create guest session');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user || guestId) {
      router.push('/onboarding');
    }
  }, [user, guestId, router]);

  // Simple welcome page with improved mobile experience
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black flex items-center justify-center px-dynamic-md"
    >
      <div className="w-full max-w-md p-dynamic-md">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-dynamic-lg"
        >
          <h1 className="text-adaptive-3xl font-bold text-white mb-2">
            Welcome to Vibe
          </h1>
          <p className="text-adaptive-base text-zinc-400 mt-2">
            Connect with others in real-time
          </p>
        </motion.div>

        <div className="space-y-dynamic-md">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Button 
              onClick={handleGuestAccess}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white min-h-touch-lg rounded-xl text-adaptive-base font-medium"
            >
              Continue as Guest
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/auth/signup" className="block">
              <Button 
                variant="outline"
                className="w-full border-zinc-700 hover:bg-zinc-800 text-white min-h-touch-lg rounded-xl text-adaptive-base font-medium"
              >
                Create Account
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center pt-dynamic-sm"
          >
            <Link 
              href="/auth/login" 
              className="text-adaptive-sm text-zinc-500 hover:text-zinc-400 py-3 px-4 inline-block"
            >
              Already have an account? Log in
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
