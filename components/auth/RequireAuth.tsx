'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const { user, guestId, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for auth to load
        if (authLoading) return;

        const currentPath = window.location.pathname;
        const isAuthPath = currentPath.startsWith('/auth/');
        const isGuestPath = currentPath.startsWith('/guest');
        const isHomePath = currentPath === '/';
        const isPublicPath = isAuthPath || isGuestPath || isHomePath;

        // Check if user is authorized
        const hasAuth = user !== null;
        const hasGuestAccess = allowGuest && guestId !== null;
        const isAllowed = hasAuth || hasGuestAccess;

        if (!isAllowed && !isPublicPath) {
          // Store current path for redirect after auth
          if (currentPath !== redirectTo) {
            localStorage.setItem('redirectAfterAuth', currentPath);
          }
          router.replace(redirectTo);
          setIsAuthorized(false);
        } else {
          setIsAuthorized(isAllowed);
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsCheckingAuth(false);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [user, guestId, authLoading, allowGuest, redirectTo, router]);

  // Show loading state while checking auth
  if (isCheckingAuth || authLoading) {
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

  // Show auth required message if not authorized
  if (!isAuthorized) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-[300px] text-center p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-medium text-zinc-300">Authentication Required</h3>
        <p className="mt-2 text-zinc-400">
          Please{' '}
          <button
            onClick={() => {
              localStorage.setItem('redirectAfterAuth', window.location.pathname);
              router.push(redirectTo);
            }}
            className="text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black rounded"
          >
            sign in
          </button>
          {' '}to access this page.
        </p>
      </motion.div>
    );
  }

  // User is authorized, render children
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
