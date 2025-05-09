"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ConfirmPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Create Supabase client
        const supabase = createClientComponentClient();
        
        // Check if we have a session already
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError.message);
          setError(sessionError.message);
          setIsProcessing(false);
          return;
        }
        
        if (session) {
          // User is already authenticated, redirect to rooms
          console.log('User already has a session, redirecting to rooms');
          setSuccess(true);
          setTimeout(() => router.push('/rooms'), 1500);
          return;
        }
        
        // If no session, the user might be coming from a confirmation link
        // The auth callback page should have already processed the token
        // Just show the confirmation success message
        setSuccess(true);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Unexpected error during confirmation:', err);
        setError(err.message || 'An unexpected error occurred');
        setIsProcessing(false);
      }
    };
    
    handleConfirmation();
  }, [router]);
  
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Verifying your account...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md w-full mx-4">
          <h2 className="text-red-400 font-medium mb-2">Verification Error</h2>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-6 left-6"
        >
          <Link 
            href="/" 
            className="flex items-center text-white/80 hover:text-white transition-colors"
            onClick={() => {
              // Add haptic feedback
              if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(3);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to home</span>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.1 
          }}
          className="mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full"
        >
          <Check className="h-12 w-12 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center max-w-md"
        >
          <h1 className="text-3xl font-bold mb-4">
            {success ? "Account Verified!" : "Check your email"}
          </h1>
          <p className="text-white/70 mb-6">
            {success 
              ? "Your account has been successfully verified. You can now access all features." 
              : "We've sent a confirmation link to your email address. Please check your inbox and follow the link to verify your account."}
          </p>
          
          <div className="mt-8">
            {success ? (
              <button
                onClick={() => router.push('/rooms')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue to App
              </button>
            ) : (
              <div className="text-white/60 text-sm">
                <p>Didn't receive an email? Check your spam folder or</p>
                <Link 
                  href="/auth/signin" 
                  className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block"
                  onClick={() => {
                    if (window.navigator && window.navigator.vibrate) {
                      window.navigator.vibrate(3);
                    }
                  }}
                >
                  Return to login
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
