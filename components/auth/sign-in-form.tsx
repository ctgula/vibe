"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { showToast } = useToast();
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
    hapticFeedback([3, 10, 3]); // Light feedback on submit

    try {
      const { error } = await signIn(email, password);

      if (error) {
        hapticFeedback([10, 5, 10, 5, 10]); // Error feedback
        showToast(error.message, "error");
      } else {
        hapticFeedback(5); // Success feedback
        showToast("Successfully signed in", "success");
        router.push("/");
      }
    } catch (error: any) {
      hapticFeedback([10, 5, 10, 5, 10]); // Error feedback
      showToast(error.message || "Failed to sign in", "error");
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

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
