'use client';
 
import { useEffect } from 'react';
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('Global error caught:', error);
  }, [error]);
 
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/40 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-zinc-400 mb-6">
            The application encountered a critical error.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
