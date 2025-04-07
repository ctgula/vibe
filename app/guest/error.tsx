'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function GuestError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Guest Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Guest Access Error</h2>
        <p className="text-zinc-400 mb-6">
          We encountered an issue with the guest access system. You can try again or sign in with an account.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
