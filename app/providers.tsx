'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-supabase-auth';
import { SimpleAuthProvider } from '@/contexts/SimpleAuthProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { ToastProvider } from '@/components/ui/toaster';

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
      <AuthProvider>
        <SimpleAuthProvider>
          <ToastProvider>
            {/* Portal container for modals and popovers */}
            <div id="portal-root" />
            <LazyMotion features={domAnimation} strict>
              <Toaster richColors position="top-center" />
              {children}
            </LazyMotion>
          </ToastProvider>
        </SimpleAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
