'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !username) {
      toast.error('Please fill in all fields');
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
        toast.error('Username is already taken');
        setLoading(false);
        return;
      }
      
      // Create new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
      
      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username,
            display_name: username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarded: false
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
        
        // Store signup info for onboarding
        localStorage.setItem('justSignedUp', 'true');
        localStorage.setItem('authUserId', data.user.id);
      }
      
      toast.success('Account created successfully!');
      router.push('/onboarding');
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-md bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Create Account</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={loading}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="username123"
            />
            <p className="text-xs text-zinc-500 mt-1">Lowercase letters, numbers, underscores only</p>
          </div>
          
          <div>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="••••••••"
            />
            <p className="text-xs text-zinc-500 mt-1">Minimum 6 characters</p>
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        
        <p className="mt-4 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
