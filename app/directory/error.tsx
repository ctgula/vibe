'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function DirectoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Directory error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/70 border border-zinc-700/30 backdrop-blur-xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Unable to Load Directory</h2>
        <p className="text-zinc-400 mb-6">
          {error?.message || 'There was an error loading the room directory.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back Home
          </a>
        </div>
      </div>
    </div>
  );
}
