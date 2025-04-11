'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGuestSession } from '@/hooks/useGuestSession';

interface RequireAuthProps {
  children: React.ReactNode;
  allowGuest?: boolean;
  redirectTo?: string;
}

export function RequireAuth({ 
  children, 
  allowGuest = false,
  redirectTo = '/auth/login'
}: RequireAuthProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { guestId, isLoading } = useGuestSession();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check auth status once both regular auth and guest auth have loaded
    if (!authLoading && !isLoading) {
      const currentPath = window.location.pathname;
      const isAuthPath = currentPath.includes('/auth/');
      const isGuestPath = currentPath.includes('/guest');
      const isHomePath = currentPath === '/';
      const isPublicPath = isAuthPath || isGuestPath || isHomePath;

      if (!user && (!guestId || !allowGuest)) {
        // No authenticated user and either no guest ID or guests not allowed
        if (!isPublicPath) {
          // Store current path for redirect after auth
          if (currentPath !== redirectTo) {
            localStorage.setItem('redirectAfterAuth', currentPath);
          }
          console.log('Not authenticated, redirecting to', redirectTo);
          router.replace(redirectTo);
        }
      }
      
      // Always update auth check status
      setIsCheckingAuth(false);
    }
  }, [user, guestId, authLoading, isLoading, allowGuest, redirectTo, router]);

  // Show loading state while checking auth
  if (isCheckingAuth || authLoading || isLoading) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[200px] py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="mt-4 text-zinc-400">Checking authentication...</p>
      </motion.div>
    );
  }

  // If guest access is allowed and we have a guest ID, or if user is authenticated
  if ((allowGuest && guestId) || user) {
    return <>{children}</>;
  }

  // Show auth required message if not redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
      <h3 className="text-lg font-medium text-zinc-300">Authentication Required</h3>
      <p className="mt-2 text-zinc-400">
        Please {' '}
        <button
          onClick={() => {
            localStorage.setItem('redirectAfterAuth', window.location.pathname);
            router.push(redirectTo);
          }}
          className="text-indigo-400 hover:text-indigo-300 underline"
        >
          sign in
        </button>
        {' '} to access this page.
      </p>
    </div>
  );
}
