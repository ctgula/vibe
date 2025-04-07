'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AuthCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Authentication Callback Error:', error);
    
    // Clear any auth flags to prevent redirect loops
    sessionStorage.removeItem('googleLoginStartTime');
    sessionStorage.removeItem('signInStartTime');
    sessionStorage.removeItem('oauthInProgress');
    sessionStorage.removeItem('oauthSignIn');
    sessionStorage.removeItem('loggingIn');
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
        <p className="text-zinc-400 mb-6">
          We encountered an issue during authentication. You can try again or continue as a guest.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
