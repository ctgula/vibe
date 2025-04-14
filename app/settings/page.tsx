'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // adjust path if needed
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        setEmail(user.email ?? '');
        // If we already have the profile from auth context, use it
        if (profile?.username) {
          setUsername(profile.username);
        } else {
          // Otherwise fetch from the database
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          setUsername(profileData?.username ?? '');
        }
      }
    };
    getUserProfile();
  }, [user, profile]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Update the profile
      const { error } = await supabase.from('profiles').update({
        username,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert(`Error: ${error.message}`);
      } else {
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6 text-gradient">Settings</h1>
      
      <div className="space-y-6 bg-zinc-800/30 p-6 rounded-lg border border-zinc-700/50">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input 
            disabled 
            value={email} 
            className="w-full p-2 rounded bg-zinc-700/50 text-white border border-zinc-600"
          />
          <p className="mt-1 text-xs text-zinc-400">Email cannot be changed</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 rounded bg-zinc-900 text-white border border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your username"
          />
        </div>
        
        <button 
          onClick={handleUpdate} 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
