"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  // Apply haptic feedback for interactions
  const hapticFeedback = (pattern: number | number[] = 3) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError("");
    hapticFeedback(5); // Feedback for submit

    try {
      await signIn(email, password);
      
      hapticFeedback([3, 30, 3]); // Success feedback
      toast.success("Successfully signed in");
      
      // Set flag for redirection logic and clear any redirect flags
      sessionStorage.setItem('justLoggedIn', 'true');
      sessionStorage.removeItem('redirectedToLogin');
      sessionStorage.removeItem('loggingIn');
      
      // Use replace instead of push to avoid history issues
      router.replace("/");
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      hapticFeedback([10, 5, 10, 5, 10]); // Error feedback
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            type="password"
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
            disabled={isLoading}
            required
          />
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
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        
        <div className="text-center mt-4">
          <Link 
            href="/auth/reset-password" 
            className="text-indigo-400 hover:text-indigo-300 text-sm"
            onClick={() => hapticFeedback()}
          >
            Forgot password?
          </Link>
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-white/60">
          Don't have an account?{" "}
          <Link 
            href="/auth/signup" 
            className="text-indigo-400 hover:text-indigo-300 font-medium"
            onClick={() => hapticFeedback()}
          >
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
