'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ToastProvider } from "@/components/ui/toast-provider"
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from '@/hooks/auth';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4 bg-red-900 text-white rounded">
      <p>Something went wrong:</p>
      <pre className="text-sm">{error?.message || 'Unknown error'}</pre>
      <button onClick={resetErrorBoundary} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Try again
      </button>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Minimal placeholder during hydration check
    return <div className="min-h-screen bg-black"></div>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
