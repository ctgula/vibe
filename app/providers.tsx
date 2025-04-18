'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-supabase-auth';
import { ErrorBoundary } from 'react-error-boundary';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={({ error }) => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <pre className="text-sm text-red-400">{error.message}</pre>
        </div>
      </div>
    )}>
      <LazyMotion features={domAnimation} strict>
        <AuthProvider>
          <Toaster richColors position="top-center" />
          {children}
        </AuthProvider>
      </LazyMotion>
    </ErrorBoundary>
  );
}
