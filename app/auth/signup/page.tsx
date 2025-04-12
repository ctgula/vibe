"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-red-400 mb-4">{error.message || "Unknown error"}</p>
      <Button onClick={resetErrorBoundary} variant="default">
        Try again
      </Button>
      <Link href="/" className="mt-4 text-blue-400 hover:underline">
        Return to home page
      </Link>
    </div>
  );
}

function SignupContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  // Use the auth hook directly
  const auth = useAuth();
  
  // Mount safely
  useEffect(() => {
    setMounted(true);
    console.log("SignupContent mounted, auth available:", !!auth);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!auth || !auth.signUp) {
        throw new Error("Authentication system not initialized");
      }
      
      // Validate username format
      if (!/^[a-z0-9_]+$/.test(username)) {
        throw new Error("Username can only contain lowercase letters, numbers, and underscores");
      }

      // First sign up with email and password only
      const { data: signUpData, error: signUpError } = await auth.signUp(email, password);
      
      if (signUpError) {
        throw signUpError;
      }
      
      // If signup successful and we have a user, we'll update the profile with username and displayName
      // This will happen when the user confirms their email
      // Store the username and displayName in localStorage to use after confirmation
      if (signUpData?.user) {
        localStorage.setItem('pendingUsername', username);
        localStorage.setItem('pendingDisplayName', displayName || username);
      }
      
      // Add haptic feedback on successful sign up
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 30, 3]);
      }
      
      toast.success("Account created successfully! Please check your email to confirm your account.");
      router.push("/auth/confirm");
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to sign up");
      toast.error(err.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col p-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
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
            <span>Back</span>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-white/60">Join the conversation</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1">
              <Input
                type="text"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-white/50 mt-1">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>
            
            <div className="space-y-1">
              <Input
                type="text"
                id="displayName"
                placeholder="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-1">
              <Input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                disabled={isLoading}
                required
                minLength={6}
              />
              <p className="text-xs text-white/50 mt-1">
                Minimum 6 characters
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-sm text-white">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-8 flex items-center justify-center">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="px-4 text-white/40 text-sm">or</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          
          <Button
            type="button"
            className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white py-2 rounded-md transition-colors flex items-center justify-center"
            onClick={() => router.push('/auth/login')}
            disabled={isLoading}
          >
            Sign in with existing account
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SignupContent />
    </ErrorBoundary>
  );
}
