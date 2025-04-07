'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Camera } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ProfileFormData {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export default function ProfilePage() {
  const { user, profile: authProfile, updateProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (authProfile) {
      setProfileData({
        username: authProfile.username || '',
        display_name: authProfile.display_name || '',
        bio: authProfile.bio || '',
        avatar_url: authProfile.avatar_url || '',
      });
    }
  }, [user, authProfile, authLoading, router]);

  const handleUpdate = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await updateProfile({
        username: profileData.username,
        display_name: profileData.display_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      });

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Error updating profile');
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="backdrop-blur-md bg-zinc-900/40 rounded-2xl border border-zinc-800/50 shadow-xl p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400">
            Profile Settings
          </h1>
          <p className="text-zinc-400">Manage your profile information and preferences.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {profileData.avatar_url ? (
                <Image
                  src={profileData.avatar_url}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
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
              Username
            </label>
            <Input
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              placeholder="your-username"
              className="w-full bg-zinc-800/50 border-zinc-700"
            />
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

          <div className="flex justify-end">
            <Button
              onClick={handleUpdate}
              disabled={saving}
              className="min-w-[120px] relative overflow-hidden group bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 hover:from-indigo-600 hover:via-fuchsia-600 hover:to-rose-600 text-white shadow-lg shadow-indigo-500/25"
            >
              <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
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
  );
}
