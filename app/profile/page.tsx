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
  const { user, profile: authProfile, isLoading: authLoading, createEmptyProfile } = useAuth();
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

  // Load profile data and handle navigation
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      console.log('No user found, redirecting to signin');
      router.push('/auth/signin');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log('Fetching profile for user:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        // If profile doesn't exist, create it
        if (!profile) {
          console.log('Profile not found, creating empty profile');
          await createEmptyProfile(user.id);
          
          // Fetch the newly created profile
          const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (newProfileError) throw newProfileError;
          
          if (newProfile) {
            setProfileData({
              username: newProfile.username || '',
              display_name: newProfile.display_name || '',
              bio: newProfile.bio || '',
              avatar_url: newProfile.avatar_url || '',
              theme_color: newProfile.theme_color || '#6366f1'
            });
          }
        } else {
          // Use existing profile data
          setProfileData({
            username: profile.username || '',
            display_name: profile.display_name || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || '',
            theme_color: profile.theme_color || '#6366f1'
          });
        }
      } catch (err) {
        console.error('Exception fetching profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router, createEmptyProfile]);

  const handleUpdate = async () => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setSaving(true);
    try {
      console.log('Updating profile for user:', user.id);
      
      // Create a sanitized username (lowercase, alphanumeric, and underscores only)
      const sanitizedUsername = profileData.username
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: sanitizedUsername,
          display_name: profileData.display_name,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          theme_color: profileData.theme_color,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-xl max-w-2xl mx-auto">
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
        </div>
      </div>
    </div>
  );
}
