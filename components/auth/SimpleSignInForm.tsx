'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { m as motion } from 'framer-motion';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordless, setIsPasswordless] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email/username and password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Determine if the identifier is an email or username
      let signInEmail = email.trim();
      
      if (!email.includes('@')) {
        // Treat as username – look up the corresponding email in the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', email.trim())
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        if (!profileData || !profileData.email) {
          throw new Error('Username not found or email not set');
        }
        
        signInEmail = profileData.email;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password
      });
      
      if (error) throw error;
      
      toast.success('Signed in successfully');
      router.push('/directory');
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: "https://vibe-9fph.vercel.app/auth/callback",
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // No need to show toast since we're redirecting
      // The callback will handle the success message
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error?.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "https://vibe-9fph.vercel.app/auth/callback"
        },
      });
      
      if (error) throw error;
      
      setMagicLinkSent(true);
      toast.success('Check your email for the magic link!');
      
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error(error?.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  // Google icon with proper styling
  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="mr-2">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.63 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  if (magicLinkSent) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-b from-zinc-900 to-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-zinc-900/70 backdrop-blur-lg p-8 rounded-2xl border border-zinc-800 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
          <p className="text-zinc-400 mb-6">
            We've sent a magic link to <strong className="text-white">{email}</strong>. 
            Click the link in the email to sign in.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-3 text-sm transition-colors"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-b from-zinc-900 to-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            Welcome back
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-zinc-400 mt-2"
          >
            Sign in to continue to your account
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-zinc-900/70 backdrop-blur-lg p-8 rounded-2xl border border-zinc-800 shadow-xl"
        >
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl px-4 py-3 text-sm font-medium transition-colors mb-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Sign in with Google
          </motion.button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-4 text-zinc-400 tracking-wider">
                or continue with email
              </span>
            </div>
          </div>
          
          <form onSubmit={isPasswordless ? handleMagicLinkSignIn : handleSubmit} className="space-y-5">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Label htmlFor="email" className="text-zinc-300 text-sm font-medium mb-1.5 flex items-center">
                <Mail size={16} className="mr-2 text-zinc-400" /> Email or Username
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-xl h-12 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="you@example.com or your_username"
              />
            </motion.div>
            
            {!isPasswordless && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="password" className="text-zinc-300 text-sm font-medium flex items-center">
                    <Lock size={16} className="mr-2 text-zinc-400" /> Password
                  </Label>
                  <Link 
                    href="/auth/reset-password" 
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-xl h-12 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                />
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="pt-2"
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 font-medium transition-all duration-300 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight size={16} className="mr-2" />
                )}
                {loading ? 'Signing in...' : isPasswordless ? 'Send Magic Link' : 'Sign in'}
              </Button>
            </motion.div>
          </form>

          <button
            onClick={() => setIsPasswordless(!isPasswordless)}
            className="w-full text-center mt-4 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            {isPasswordless ? 'Sign in with password instead' : 'Sign in with magic link instead'}
          </button>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 text-center text-sm text-zinc-400"
        >
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create account
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
