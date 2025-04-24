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
import { Loader2, Mail, Lock, User, AtSign, AlertCircle, ArrowRight } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple inline SVG for Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.63 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 border border-red-500 bg-red-50 rounded-md text-red-800 my-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle size={20} />
        <h3 className="font-semibold">Something went wrong</h3>
      </div>
      <p className="text-sm mb-3">{error.message || "Unknown error"}</p>
      <Button 
        variant="outline"
        onClick={resetErrorBoundary}
        className="text-sm"
      >
        Try again
      </Button>
    </div>
  );
}

function SignupContent() {
  const { signUp, signInWithOAuth, isLoading } = useAuth();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const router = useRouter();

  // Form validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      username: '',
      displayName: ''
    };
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email format is invalid';
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (!/^[a-z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain lowercase letters, numbers, and underscores';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithOAuth('google');
      toast.success('Redirecting to Google...');
    } catch (error: any) {
      console.error('Google Sign In/Up Error:', error);
      toast.error(error.message || 'Failed to sign up with Google.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      console.log('Starting signup process...', { email, username });
      
      // 1. Sign up with Supabase Auth
      const response = await signUp(email, password);
      
      // 2. Check if user creation was successful
      if (response.error) {
        throw response.error;
      }
      
      // 3. Store username and display name in profiles table
      if (response.data?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: response.data.user.id,
            username: username,
            display_name: displayName || username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_guest: false
          });
          
        if (profileError) {
          console.error('Error updating profile:', profileError);
          // We don't throw here because the user was created successfully
          toast.error('Account created, but there was an issue setting up your profile.');
        }
      }
      
      // 4. Show confirmation message
      if (!response.data?.user?.email_confirmed_at) {
        toast.success('Check your email to confirm your account!');
        router.push('/auth/check-email');
      } else {
        toast.success('Account created successfully!');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message.includes('duplicate key')) {
        toast.error('This email or username is already in use.');
      } else {
        toast.error(error.message || 'Failed to create account.');
      }
    }
  };

  // Consistent input styles
  const inputStyles = "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500";

  return (
    <div className="w-full max-w-md">
      <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-200 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription className="text-zinc-400">
            Get started with your Vibe profile
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-gray-200 border-zinc-300 transition-all duration-300"
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
              <Label htmlFor="email" className="flex items-center">
                <Mail size={16} className="mr-2" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyles}
                disabled={isLoading}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username" className="flex items-center">
                <AtSign size={16} className="mr-2" /> Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="your_username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={inputStyles}
                disabled={isLoading}
                aria-invalid={!!errors.username}
              />
              {errors.username ? (
                <p className="text-red-400 text-xs mt-1">{errors.username}</p>
              ) : (
                <p className="text-xs text-zinc-500">Lowercase letters, numbers, underscores only.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="flex items-center">
                <User size={16} className="mr-2" /> Display Name <span className="text-zinc-500 ml-1">(Optional)</span>
              </Label>
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
              <Label htmlFor="password" className="flex items-center">
                <Lock size={16} className="mr-2" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyles}
                disabled={isLoading}
                aria-invalid={!!errors.password}
              />
              {errors.password ? (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              ) : (
                <p className="text-xs text-zinc-500">Minimum 6 characters.</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight size={16} className="mr-2" />
              )}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-indigo-400 hover:underline hover:text-indigo-300 transition-all">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SignupContent />
      </ErrorBoundary>
    </div>
  );
}
