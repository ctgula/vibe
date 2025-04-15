'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/70 border border-zinc-700/30 shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-zinc-400 mb-6">
          {error?.message || 'An unexpected error has occurred.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
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
  );
}
