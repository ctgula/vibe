'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/auth/signup');
  }, [router]);
  
  // Simple loading state while redirect happens
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-zinc-400">Redirecting to sign up...</p>
      </div>
    </div>
  );
}
