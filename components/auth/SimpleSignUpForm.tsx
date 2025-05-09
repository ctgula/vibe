'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { m as motion } from 'framer-motion';
import { Loader2, Mail, User, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { signUp, signInWithOAuth } = useAuth();

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    // Contains number
    if (/\d/.test(password)) strength += 1;
    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [password]);

  const validateForm = () => {
    const newErrors = {
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email format is invalid';
      isValid = false;
    }

    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
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

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingUser) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        setLoading(false);
        return;
      }
      
      // Use the signUp method from useAuth hook
      await signUp(email, password);
      
      // The signUp method in useAuth already handles profile creation,
      // success messages, and redirection
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error?.message || 'Failed to create account');
      
      // Handle specific error cases
      if (error.message?.includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
      } else if (error.message?.includes('password')) {
        setErrors(prev => ({ ...prev, password: error.message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Store provider info for callback
      localStorage.setItem('auth_provider', 'google');
      await signInWithOAuth('google');
      toast.success('Redirecting to Google...');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error?.message || 'Failed to sign in with Google');
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
            Create your account
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-zinc-400 mt-2"
          >
            Join our community and start creating
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-zinc-900/70 backdrop-blur-lg p-8 rounded-2xl border border-zinc-800 shadow-xl"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all duration-200 mb-6"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Sign up with Google
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
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Label htmlFor="email" className="text-zinc-300 text-sm font-medium mb-1.5 flex items-center">
                <Mail size={16} className="mr-2 text-zinc-400" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-xl h-12 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {errors.email}
                </p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Label htmlFor="username" className="text-zinc-300 text-sm font-medium mb-1.5 flex items-center">
                <User size={16} className="mr-2 text-zinc-400" /> Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                disabled={loading}
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-xl h-12 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="username123"
                aria-invalid={!!errors.username}
              />
              {errors.username ? (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {errors.username}
                </p>
              ) : (
                <p className="text-xs text-zinc-500 mt-1">Lowercase letters, numbers, underscores only</p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Label htmlFor="password" className="text-zinc-300 text-sm font-medium mb-1.5 flex items-center">
                <Lock size={16} className="mr-2 text-zinc-400" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-xl h-12 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
              />
              {errors.password ? (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {errors.password}
                </p>
              ) : (
                <div className="mt-1">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          passwordStrength >= level 
                            ? level <= 2 
                              ? 'bg-red-500' 
                              : level <= 3 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {passwordStrength === 0 && 'Enter a password'}
                    {passwordStrength === 1 && 'Very weak password'}
                    {passwordStrength === 2 && 'Weak password'}
                    {passwordStrength === 3 && 'Medium strength password'}
                    {passwordStrength === 4 && 'Strong password'}
                    {passwordStrength === 5 && 'Very strong password'}
                  </p>
                </div>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm font-medium mb-1.5 flex items-center">
                <CheckCircle size={16} className="mr-2 text-zinc-400" /> Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-xl h-12 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="••••••••"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {errors.confirmPassword}
                </p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
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
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </motion.div>
          </form>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="mt-6 text-center text-sm text-zinc-400"
        >
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
