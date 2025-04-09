'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ToastProvider } from "@/components/ui/toast-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from '@/contexts/AuthProvider';
import { ThemeProvider as NextThemesProvider } from "@/components/theme-provider";
import { NavBar } from '@/components/layout/NavBar';

// Dynamically import non-critical components
const SplashScreen = dynamic(() => import('@/components/splash-screen').then(mod => mod.SplashScreen), {
  ssr: false
});

const PWAHandler = dynamic(() => import('@/components/PWAHandler').then(mod => mod.PWAHandler), {
  ssr: false
});

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4 bg-red-100 text-red-900 rounded">
      <p>Something went wrong:</p>
      <pre className="text-sm">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        Try again
      </button>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Wait until after client-side hydration to show
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same structure to avoid hydration mismatch
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ToastProvider>
          <div className="min-h-screen bg-black">{/* Empty placeholder */}</div>
        </ToastProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <NextThemesProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                <SplashScreen />
                <PWAHandler />
                {children}
                <NavBar />
              </NextThemesProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
