"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple inline SVG for Google Icon (Same as sign-in)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    {/* SVG paths */}
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.63 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

// ErrorFallback remains the same
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
  const { signUp, signInWithOAuth, isLoading } = useAuth(); // Get methods from hook
  const supabase = createClientComponentClient(); // Re-initialize client
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  // Use toast for feedback, no need for separate error state string? Let's keep it for form-level errors.
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setFormError(null); // Clear form error on new action
    try {
      await signInWithOAuth('google');
      // Supabase handles redirect
      toast.success('Redirecting to Google...');
    } catch (error: any) {
      console.error('Google Sign In/Up Error:', error);
      toast.error(error.message || 'Failed to sign up with Google.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous errors

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(username)) {
      const message = "Username can only contain lowercase letters, numbers, and underscores.";
      setFormError(message);
      toast.error(message);
      return;
    }
    if (password.length < 6) {
      const message = "Password must be at least 6 characters long.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      // 1. Call signUp from the hook with only email and password
      const response = await signUp(email, password); // Store the full response

      // Check for Supabase auth error
      if (response.error || !response.data?.user) { // Access error and data from response
        const message = response.error?.message || "Failed to sign up with Supabase Auth.";
        console.error("Supabase Sign Up Error:", response.error);
        setFormError(message);
        toast.error(message);
        return; // Stop execution if auth fails
      }

      // 2. Create user profile row AFTER successful auth
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: response.data.user.id, // Use the ID from the successful response.data.user
            username,
            display_name: displayName || username,
            is_guest: false, // Ensure this is false for registered users
            // created_at: new Date().toISOString(), // Handled by db default now? Check schema. Assuming yes.
          },
        ]);

      if (profileError) {
        // Log the error, inform the user, but the auth user *is* created.
        // Might need a cleanup mechanism or user guidance here.
        console.error("Error creating profile after sign up:", profileError);
        toast.error("Account created, but failed to set up profile. Please contact support.");
        // Decide if we should still proceed with redirect or stop here. Let's redirect for now.
      } else {
        toast.success("Account created successfully! Please check your email to confirm.");
      }

      // 3. Redirect to confirmation page
      router.push("/auth/confirm");

    } catch (error: any) {
      // Catch errors specifically from the signUp call if it throws internally
      console.error("Sign up process error:", error);
      const message = error.message || "An unexpected error occurred during sign up.";
      setFormError(message);
      toast.error(message);
    }
  };

  // Input field styling consistent with sign-in
  const inputStyles = "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500";

  return (
    <div className="w-full max-w-md">
      <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-200 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your details below to sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-gray-200 border-zinc-300"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Sign up with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyles}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your_username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={inputStyles}
                disabled={isLoading}
                pattern="^[a-z0-9_]+$"
                title="Lowercase letters, numbers, underscores only."
              />
              <p className="text-xs text-zinc-500">Lowercase letters, numbers, underscores only.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name <span className="text-zinc-500">(Optional)</span></Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputStyles}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyles}
                disabled={isLoading}
              />
              <p className="text-xs text-zinc-500">Minimum 6 characters.</p>
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="underline hover:text-indigo-400">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// SignupPage wrapper remains the same
export default function SignupPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SignupContent />
    </ErrorBoundary>
  );
}
