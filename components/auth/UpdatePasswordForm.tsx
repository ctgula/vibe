'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [missingToken, setMissingToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Safely handle client-side operations
  useEffect(() => {
    setIsClient(true);
    
    // Check if we have the access token in URL params
    const checkToken = () => {
      // Look for either access_token or code parameter
      const accessToken = searchParams.get('access_token') || searchParams.get('code');
      
      if (!accessToken) {
        console.error('Missing access token in URL params');
        setMissingToken(true);
        toast.error('Invalid or expired password reset link');
      }
    };
    
    checkToken();
  }, [searchParams]);

  const validatePassword = () => {
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    // Get the access token from URL
    const accessToken = searchParams.get('access_token') || searchParams.get('code');
    
    if (!accessToken) {
      console.error('Missing access token in URL params');
      setError('Invalid or expired password reset link. Please request a new password reset link.');
      toast.error('Missing access token');
      return;
    }
    
    setIsLoading(true);
    
    // Add safety timeout
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
      toast.error('Request took too long. Please try again.');
    }, 10000);
    
    try {
      console.log('Updating password using access token');
      
      try {
        // First try to verify the token by exchanging it for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(accessToken);
        
        if (exchangeError) {
          console.error('Error exchanging token for session:', exchangeError);
          setError('Your password reset link has expired. Please request a new link.');
          toast.error('Password reset link expired');
          return;
        }
        
        // Now update the password using the newly established session
        const { error: updateError } = await supabase.auth.updateUser({ password });
        
        if (updateError) {
          console.error('Error updating password:', updateError);
          setError(updateError.message || 'Failed to update password');
          toast.error(updateError.message || 'Failed to update password');
        } else {
          setSuccess(true);
          toast.success('Password updated successfully!');
          
          // Clear form
          setPassword('');
          setConfirmPassword('');
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        }
      } catch (err: any) {
        console.error('Exception updating password:', err);
        setError(err.message || 'An unexpected error occurred');
        toast.error(err.message || 'An unexpected error occurred');
      }
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  };

  // Prevent hydration issues by only rendering on client
  if (!isClient) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-200 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-200 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Update Your Password</CardTitle>
            <CardDescription className="text-zinc-400">
              Create a new secure password for your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">Password Updated!</h3>
                <p className="text-zinc-400 mb-6">
                  Your password has been updated successfully. You'll be redirected to sign in.
                </p>
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : missingToken ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">Invalid or Expired Link</h3>
                <p className="text-zinc-400 mb-6">
                  The password reset link is invalid or has expired. Please request a new password reset link.
                </p>
                <Button 
                  onClick={() => router.push('/auth/reset-password')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Request New Link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="flex items-center text-sm text-zinc-400">
                    <Lock size={16} className="mr-2" /> New Password
                  </label>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Enter new password"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-zinc-500">Must be at least 6 characters</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="flex items-center text-sm text-zinc-400">
                    <Lock size={16} className="mr-2" /> Confirm Password
                  </label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                    <AlertTriangle size={16} className="mr-2" />
                    {error}
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} className="mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          {!success && !missingToken && (
            <CardFooter className="flex justify-center border-t border-zinc-800 pt-4">
              <div className="text-sm text-zinc-400">
                <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300">
                  Return to sign in
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
