"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // First sign up with email and password
      const { data, error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        throw signUpError;
      }
      
      // Then update the profile with username and display name
      if (data?.user) {
        // Add haptic feedback on successful sign up
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([3, 30, 3]);
        }
        router.push("/auth/confirm");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to sign up");
      // Add subtle haptic feedback for error
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([10, 5, 10]);
      }
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
            type="text"
            id="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            className="bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
            disabled={isLoading}
            required
          />
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
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-red-400 text-sm mt-2"
          >
            {error}
          </motion.p>
        )}

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
