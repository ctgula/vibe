'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Camera, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const supabase = createClientComponentClient();

interface ProfileFormData {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme_color: string;
}

export default function ProfilePage() {
  const { user, profile: authProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    theme_color: '#6366f1'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    // Don't fetch until auth state is determined
    if (authLoading) {
      console.log('Auth is still loading, waiting...');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use profile data from auth context, with defaults for missing fields
        if (authProfile) {
          console.log('Using profile from auth context:', authProfile);
          setProfileData({
            username: authProfile.username || '',
            display_name: authProfile.display_name || '',
            bio: '',  // Default to empty string since bio is not in schema
            avatar_url: authProfile.avatar_url || '',
            theme_color: '#6366f1'  // Default to indigo since theme_color is not in schema
          });
          setLoading(false);
          return;
        }
        
        // If no auth profile and no user, redirect to sign in
        if (!user && !localStorage.getItem('guestProfileId')) {
          console.log('No user or guest profile, redirecting to sign in');
          router.push('/auth/signin');
          return;
        }
        
        // Direct database fetch as fallback
        const profileId = user?.id || localStorage.getItem('guestProfileId');
        if (!profileId) {
          throw new Error('No profile ID available');
        }
        
        console.log('Fetching profile from database for ID:', profileId);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (profile) {
          console.log('Profile found in database:', profile);
          setProfileData({
            username: profile.username || '',
            display_name: profile.display_name || '',
            bio: profile.bio || '',  // Default to empty string since bio is not in schema
            avatar_url: profile.avatar_url || '',
            theme_color: profile.theme_color || '#6366f1'  // Default to indigo since theme_color is not in schema
          });
        } else {
          console.log('No profile found for ID:', profileId);
          // Show empty form with defaults for new users
          setProfileData({
            username: `user_${Date.now().toString(36)}`,
            display_name: user?.email?.split('@')[0] || 'New User',
            bio: '',
            avatar_url: '',
            theme_color: '#6366f1'
          });
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, authProfile, router]);

  const handleUpdate = async () => {
    const profileId = user?.id || localStorage.getItem('guestProfileId');
    
    if (!profileId) {
      toast.error('No profile ID available for update');
      return;
    }

    setSaving(true);
    try {
      console.log('Updating profile for ID:', profileId);
      
      // Create a sanitized username
      const sanitizedUsername = profileData.username
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        || `user_${Date.now().toString(36)}`;
      
      const updateData = {
        id: profileId,
        username: sanitizedUsername,
        display_name: profileData.display_name || sanitizedUsername,
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        theme_color: profileData.theme_color || '#6366f1',
        updated_at: new Date().toISOString(),
        is_guest: localStorage.getItem('guestProfileId') ? true : false
      };
      
      console.log('Profile update data:', updateData);
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      toast.success('Profile updated successfully!');
      
      // Force reload the profile after update
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Error in profile update:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          onClick={() => router.push('/rooms')}
          variant="ghost" 
          className="mb-8 hover:bg-zinc-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>
        
        <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/50 backdrop-blur">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => router.push('/rooms')}>
                  Return to Rooms
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer">
                    {profileData.avatar_url ? (
                      <Image
                        src={profileData.avatar_url}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="rounded-full object-cover w-20 h-20"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: profileData.theme_color }}
                      >
                        {profileData.display_name ? profileData.display_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Avatar URL
                    </label>
                    <Input
                      type="text"
                      value={profileData.avatar_url}
                      onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <Input
                    type="text"
                    value={profileData.display_name}
                    onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                    placeholder="Your display name"
                    className="w-full bg-zinc-800/50 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Username <span className="text-zinc-500 text-xs">(letters, numbers, underscores only)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">@</span>
                    <Input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => {
                        // Sanitize username as user types
                        const sanitized = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, '');
                        setProfileData({ ...profileData, username: sanitized });
                      }}
                      placeholder="username"
                      className="w-full bg-zinc-800/50 border-zinc-700 pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Bio
                  </label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    className="w-full h-32 bg-zinc-800/50 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Theme Color
                  </label>
                  <div className="flex gap-2 mt-2">
                    {['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setProfileData({ ...profileData, theme_color: color })}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                          profileData.theme_color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="min-w-[120px] relative overflow-hidden group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
