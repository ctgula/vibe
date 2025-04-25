'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { motion } from 'framer-motion';

export default function CreateRoomRedirect() {
  const router = useRouter();
  const { isLoading: authLoading, user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (!mounted) return;
    
    console.log('CreateRoomRedirect - Auth state:', { user: !!user, authLoading });
    
    // Wait for auth states to load
    if (authLoading) {
      console.log('Still loading auth state, waiting...');
      return;
    }
    
    // Store current URL before redirecting
    const storedRedirect = localStorage.getItem('redirectAfterAuth');
    console.log('Stored redirect:', storedRedirect);
    
    // Only redirect if we haven't already stored a destination
    if (!storedRedirect) {
      localStorage.setItem('redirectAfterAuth', '/room/create');
      console.log('Stored redirect to /room/create');
    }
    
    // Get the guestId from localStorage
    const guestId = localStorage.getItem('guestProfileId');
    
    // Redirect to the new room creation page if authenticated or guest
    if (user || guestId) {
      console.log(`Redirecting to room creation with ${user ? 'authenticated user' : 'guest user'}`);
      router.replace('/room/create');
    } else {
      // Redirect to login if not authenticated
      console.log('No authentication found, redirecting to login');
      router.replace('/auth/signin');
    }
  }, [router, user, authLoading, mounted]);
  
  // Show loading state while auth is initializing
  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect to login if not authenticated and not a guest
  if (!user && !localStorage.getItem('guestProfileId')) {
    router.push('/auth/signin');
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to room creation...</p>
      </motion.div>
    </div>
  );
}
