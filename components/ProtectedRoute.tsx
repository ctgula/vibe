'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean; // If true, requires authenticated user
  fallbackRoute?: string; // Where to redirect if not authenticated
}

export function ProtectedRoute({ 
  children, 
  requireAuth = false,
  fallbackRoute = '/onboarding'
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Log auth state for debugging
  useEffect(() => {
    console.log('Protected route auth state:', { 
      user: !!user, 
      isLoading, 
      isAuthenticated
    });
  }, [user, isLoading, isAuthenticated]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold">Loading Vibe App...</h2>
        <p className="text-zinc-300 mt-2">Setting up your experience</p>
      </div>
    );
  }

  // Handle authentication requirements
  if (requireAuth && !user) {
    // If auth is required and user is not authenticated
    console.log('Auth required but user not authenticated, redirecting to:', fallbackRoute);
    router.push(fallbackRoute as any);
    return null;
  }

  // Handle basic authentication
  if (!isAuthenticated) {
    // If no authentication
    console.error("No user available for protected route");
    console.log('No authentication found, redirecting to:', fallbackRoute);
    router.push(fallbackRoute as any);
    return null;
  }

  // User is authenticated
  return <>{children}</>;
}
