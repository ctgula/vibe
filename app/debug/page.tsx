'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const supabase = createClientComponentClient();

export default function DebugPage() {
  const router = useRouter();
  const { user, profile, isLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [guestInfo, setGuestInfo] = useState<{id: string | null}>({
    id: null
  });
  
  useEffect(() => {
    // Check for guest ID in localStorage
    const guestId = localStorage.getItem('guestProfileId');
    setGuestInfo({ id: guestId });
    
    // Always attempt to fetch the profile directly from the database
    const fetchProfileDirect = async () => {
      const userId = user?.id || guestId;
      if (!userId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching profile:', error);
          setMessage(`Error fetching profile: ${error.message}`);
        } else if (data) {
          setProfileData(data);
          setMessage('Profile fetched directly from database');
        } else {
          setMessage('No profile found in database');
        }
      } catch (err) {
        console.error('Exception fetching profile:', err);
        setMessage(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileDirect();
  }, [user]);
  
  const createProfileForce = async () => {
    const userId = user?.id || guestInfo.id;
    if (!userId) {
      setMessage('No user ID available');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/force-profile?id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Profile force operation: ${data.message}`);
        setProfileData(data.profile);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fixRoomRelationships = async () => {
    try {
      setLoading(true);
      setMessage('Attempting to fix room relationships...');
      
      const response = await fetch('/api/simple-fix');
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Room fix: ${data.message}`);
      } else {
        setMessage(`Error fixing rooms: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Authentication Info</h2>
          <div className="space-y-2 mb-6">
            <p><span className="text-zinc-400">Loading:</span> {isLoading ? 'Yes' : 'No'}</p>
            <p><span className="text-zinc-400">User:</span> {user ? `ID: ${user.id.substring(0, 8)}...` : 'Not signed in'}</p>
            <p><span className="text-zinc-400">Email:</span> {user?.email || 'None'}</p>
            <p><span className="text-zinc-400">Guest ID:</span> {guestInfo.id ? `${guestInfo.id.substring(0, 8)}...` : 'None'}</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/rooms')}
              className="w-full bg-zinc-800 hover:bg-zinc-700"
            >
              Go to Rooms
            </Button>
            
            <Button 
              onClick={() => router.push('/profile')}
              className="w-full bg-zinc-800 hover:bg-zinc-700"
            >
              Go to Profile
            </Button>
            
            {user && (
              <Button 
                onClick={() => signOut()}
                variant="destructive"
                className="w-full"
              >
                Sign Out
              </Button>
            )}
            
            {!user && (
              <Button 
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="bg-zinc-800 p-4 rounded mb-4 overflow-auto max-h-80">
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-all">
                  {profileData ? JSON.stringify(profileData, null, 2) : 'No profile data available'}
                </pre>
              </div>
              
              <p className="text-sm mb-4 text-yellow-400">{message}</p>
              
              <div className="space-y-3">
                <Button 
                  onClick={createProfileForce}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Force Create/Update Profile
                </Button>
                
                <Button 
                  onClick={fixRoomRelationships}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Fix Room Relationships
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Debug Links</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Link href="/api/fix-all" target="_blank" className="block p-3 bg-zinc-800 rounded hover:bg-zinc-700 text-center">
            Fix All
          </Link>
          <Link href="/api/fix-rooms" target="_blank" className="block p-3 bg-zinc-800 rounded hover:bg-zinc-700 text-center">
            Fix Rooms
          </Link>
          <Link href="/api/simple-fix" target="_blank" className="block p-3 bg-zinc-800 rounded hover:bg-zinc-700 text-center">
            Simple Fix
          </Link>
          <Link href="/api/auth-debug" target="_blank" className="block p-3 bg-zinc-800 rounded hover:bg-zinc-700 text-center">
            Auth Debug
          </Link>
        </div>
      </div>
    </div>
  );
}
