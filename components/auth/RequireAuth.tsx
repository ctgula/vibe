'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { m } from 'framer-motion';
import type { Route } from 'next';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ 
  children, 
  redirectTo = '/auth/signin'
}: RequireAuthProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (authLoading) {
          setIsCheckingAuth(true);
          return;
        }

        setIsCheckingAuth(true);

        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.startsWith('/auth/signin');
        const isSignupPage = currentPath.startsWith('/auth/signup');
        const isVerifyPage = currentPath.startsWith('/auth/verify');
        const isCallbackPage = currentPath.startsWith('/auth/callback');
        const isOnAuthFlowPage = isLoginPage || isSignupPage || isVerifyPage || isCallbackPage;

        const hasAuth = user !== null;
        const isAllowed = hasAuth;

        console.log('[RequireAuth]', { currentPath, hasAuth, isAllowed, isOnAuthFlowPage });

        if (!isAllowed && !isOnAuthFlowPage) {
          console.log(`[RequireAuth] Not allowed on ${currentPath}, redirecting to ${redirectTo}`);
          if (currentPath !== redirectTo) {
            localStorage.setItem('redirectAfterAuth', currentPath);
          }
          router.replace(redirectTo as Route);
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('[RequireAuth] Error checking auth:', error);
        setIsCheckingAuth(false);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [user, authLoading, redirectTo, router]);

  if (isCheckingAuth || authLoading) {
    return (
      <m.div
        className="flex flex-col items-center justify-center min-h-[200px] py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="mt-4 text-zinc-400">Checking access...</p>
      </m.div>
    );
  }

  if (!isAuthorized) {
    return (
      <m.div
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
              router.push(redirectTo as Route);
            }}
            className="text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black rounded"
          >
            sign in
          </button>
          {' '}to access this page.
        </p>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      {children}
    </m.div>
  );
}
