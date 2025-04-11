'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { motion } from 'framer-motion';

export default function CreateRoomRedirect() {
  const router = useRouter();
  const { isLoading: authLoading, isGuest, isAuthenticated, user, profile } = useAuth();
  const { guestId, isLoading } = useGuestSession();
  
  useEffect(() => {
    console.log('CreateRoomRedirect - Auth state:', { user: !!user, guestId: !!guestId, authLoading, isLoading });
    
    // Wait for auth states to load
    if (authLoading || isLoading) {
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
    
    // Redirect to the new room creation page if authenticated or guest
    if (user || guestId) {
      console.log(`Redirecting to room creation with ${user ? 'authenticated user' : 'guest user'}`);
      router.replace('/room/create');
    } else {
      // Redirect to login if not authenticated
      console.log('No authentication found, redirecting to login');
      router.replace('/auth/login');
    }
  }, [router, user, guestId, authLoading, isLoading]);
  
  // Show loading state while auth is initializing
  if (authLoading) {
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
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
