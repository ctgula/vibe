'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/auth";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { user, guestId, createGuestSession } = useAuth();

  // Handle guest access
  const handleGuestAccess = async () => {
    try {
      if (!createGuestSession) {
        toast.error('System error. Please try again.');
        return;
      }
      
      await createGuestSession();
      router.push('/onboarding');
    } catch (error) {
      toast.error('Failed to create guest session');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user || guestId) {
      router.push('/onboarding');
    }
  }, [user, guestId, router]);

  // Simple welcome page
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome to Vibe
          </h1>
          <p className="text-zinc-400 mt-2">
            Connect with others in real-time
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGuestAccess}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12"
          >
            Continue as Guest
          </Button>

          <Link href="/auth/signup" className="block">
            <Button 
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 text-white h-12"
            >
              Create Account
            </Button>
          </Link>

          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="text-sm text-zinc-500 hover:text-zinc-400"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
