'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-supabase-auth';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('demo@example.com', 'demo123');
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error(error.message || 'Failed to sign in with demo account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="relative px-4 py-8">
          <Link href="/" className="inline-flex items-center">
            <m.div
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </m.div>
          </Link>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-20">
          <div className="max-w-sm mx-auto">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-zinc-400 mb-8">Sign in to continue to Vibe</p>
            </m.div>

            <m.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-white placeholder-zinc-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-white placeholder-zinc-500 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-white font-medium transition-all
                  ${isLoading
                    ? 'bg-indigo-600/50 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
                  }
                `}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </m.button>

              {/* Demo Account Button */}
              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-medium transition-all border
                  ${isLoading
                    ? 'border-white/5 text-white/50 cursor-not-allowed'
                    : 'border-white/10 text-white hover:bg-white/5'
                  }
                `}
              >
                Try demo account
              </m.button>
            </m.form>

            {/* Sign Up Link */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-center"
            >
              <p className="text-zinc-400">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sign up
                </Link>
              </p>
            </m.div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
