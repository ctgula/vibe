'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError('');
    setMessage('');
    
    // Create a safety timeout to prevent hanging
    const safetyTimeout = setTimeout(() => {
      console.log('Password reset safety timeout reached');
      setLocalLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 10000);
    
    try {
      console.log('Requesting password reset for:', email);
      toast.info('Sending password reset instructions...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        setError(error.message || 'Failed to send reset password email');
        toast.error(error.message || 'Failed to send reset password email');
      } else {
        setMessage(`Reset password instructions sent to ${email}. Please check your inbox.`);
        toast.success(`Reset password instructions sent to ${email}`);
      }
    } catch (err: any) {
      console.error('Password reset exception:', err);
      setError(err.message || 'An error occurred');
      toast.error(err.message || 'An error occurred');
    } finally {
      clearTimeout(safetyTimeout);
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-200 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center">
              <Link href="/auth/signin">
                <Button variant="ghost" size="icon" className="h-8 w-8 mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <CardTitle className="text-xl">Reset Password</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Enter your email to receive password reset instructions
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center text-sm text-zinc-400">
                  <Mail size={16} className="mr-2" /> Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  disabled={localLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={localLoading}
              >
                {localLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending instructions...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>

              {message && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-sm">
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-zinc-800 pt-4">
            <div className="text-sm text-zinc-400">
              <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300">
                Return to sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
