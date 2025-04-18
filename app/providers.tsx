'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/use-supabase-auth'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/70 border border-zinc-700/30 shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-zinc-400 mb-6">
          {error?.message || 'An unexpected error has occurred.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={resetErrorBoundary}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        {children}
        <Toaster theme="dark" position="top-center" closeButton richColors />
      </AuthProvider>
    </ErrorBoundary>
  )
}
