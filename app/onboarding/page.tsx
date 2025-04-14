'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthProvider';
import { ArrowRight, Check, User, Palette, MessageSquare, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [totalSteps] = useState(4);
  const [profile, setProfile] = useState({
    id: '',
    username: '',
    avatar_url: '',
    bio: '',
    theme_color: '#6366f1',
    is_guest: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const router = useRouter();
  const { user, profile: authProfile, guestId } = useAuth();

  // Available theme colors
  const themeColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#3b82f6', // Blue
  ];

  // Handle client-side initialization
  useEffect(() => {
    checkProfile();
  }, []);

  // Check if user already has a profile
  const checkProfile = async () => {
    try {
      // Determine the user ID (authenticated or guest)
      const currentUserId = user?.id || guestId;
      
      if (!currentUserId) {
        setError('User ID not found');
        console.error('No user ID found in checkProfile');
        return;
      }
      
      console.log('Checking profile for user ID:', currentUserId);
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
        
      if (!profileError && profileData) {
        // If profile exists and has username, redirect to home
        if (profileData.username) {
          router.push('/');
          return;
        }
        
        // Otherwise, use the existing profile data
        setProfile({
          id: profileData.id,
          username: profileData.username || '',
          avatar_url: profileData.avatar_url || '',
          bio: profileData.bio || '',
          theme_color: profileData.theme_color || '#6366f1',
          is_guest: profileData.is_guest || true
        });
      } else if (authProfile && authProfile.id) {
        // Use auth profile if available
        setProfile({
          id: authProfile.id,
          username: authProfile.username || '',
          avatar_url: authProfile.avatar_url || '',
          bio: authProfile.bio || '',
          theme_color: authProfile.theme_color || '#6366f1',
          is_guest: authProfile.is_guest || false
        });
      } else {
        // If no profile found, use the current user ID
        setProfile(prev => ({
          ...prev,
          id: currentUserId
        }));
      }
    } catch (err) {
      console.error('Error checking profile:', err);
    }
  };

  const nextStep = () => {
    setDirection('forward');
    setStep(prev => Math.min(prev + 1, totalSteps + 1));
  };

  const prevStep = () => {
    setDirection('back');
    setStep(prev => Math.max(prev - 1, 0));
  };

  const updateProfile = (data: Partial<typeof profile>) => {
    setProfile(prev => ({ ...prev, ...data }));
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate profile data
      if (!profile.username.trim()) {
        setError('Username is required');
        setStep(1); // Go back to username step
        return;
      }
      
      // Get current user ID
      const currentUserId = user?.id || guestId;
      
      if (!currentUserId) {
        setError('User ID not found');
        return;
      }
      
      console.log('Saving profile with data:', {
        ...profile,
        id: currentUserId
      });
      
      // Update the profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUserId,
          username: profile.username,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          theme_color: profile.theme_color,
          is_guest: profile.is_guest,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(`Failed to save profile: ${updateError.message}`);
        return;
      }
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] px-4 py-safe-top pb-safe-bottom relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Animated background blobs */}
      <motion.div className="absolute -top-40 -left-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl animate-pulse z-0" animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }} />
      <motion.div className="absolute -bottom-40 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse z-0" animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }} />
      <motion.section
        className="w-full max-w-xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-12 flex flex-col items-center relative z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7, type: 'spring' }}
      >
        <Logo className="mb-2 h-10 w-10 text-sky-400 drop-shadow-xl animate-bounce" />
        <motion.h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-300 drop-shadow-lg mb-2 flex items-center justify-center gap-2">
          Onboarding <Sparkles className="inline w-6 h-6 text-pink-400 animate-pulse" />
        </motion.h2>
        <p className="text-zinc-200 text-lg text-center mb-6">Set up your profile to join the vibe!</p>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Welcome to VIBE</h3>
              <p className="text-zinc-200 text-lg text-center mb-8">Let's set up your profile so you can start connecting with others in real-time.</p>
              <Button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white text-lg font-semibold shadow-lg"
                onClick={nextStep}
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div
              key="username"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Choose a username</h3>
              <Input
                type="text"
                placeholder="Enter username"
                value={profile.username}
                onChange={(e) => updateProfile({ username: e.target.value })}
                className="bg-zinc-900/70 border-zinc-700/50 text-white placeholder:text-zinc-500 py-7 text-xl px-6 rounded-xl w-full"
                autoFocus
              />
              <p className="text-zinc-200 text-lg text-center mb-8">This is how others will identify you in rooms and conversations.</p>
              <Button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white text-lg font-semibold shadow-lg"
                onClick={nextStep}
                disabled={!profile.username.trim()}
              >
                Next <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Choose an avatar</h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-40 h-40 mb-8 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20"
              >
                <Avatar className="w-full h-full">
                  <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.username || 'guest'}`} />
                  <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase() || 'VB'}</AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 w-full">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      profile.avatar_url === `https://api.dicebear.com/6.x/avataaars/svg?seed=${i}` 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/30' 
                        : 'border-transparent hover:border-indigo-500/50'
                    }`}
                    onClick={() => {
                      const newAvatarUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${i}`;
                      console.log('Setting avatar URL to:', newAvatarUrl);
                      updateProfile({ avatar_url: newAvatarUrl });
                    }}
                  >
                    <img 
                      src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${i}`} 
                      alt={`Avatar option ${i+1}`}
                      className="w-full h-full"
                    />
                  </motion.div>
                ))}
              </div>
              <Button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white text-lg font-semibold shadow-lg"
                onClick={nextStep}
              >
                Next <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Add a bio</h3>
              <Textarea
                placeholder="I'm interested in..."
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                className="bg-zinc-900/70 border-zinc-700/50 text-white placeholder:text-zinc-500 min-h-[150px] resize-none rounded-xl text-lg p-6 w-full"
              />
              <p className="text-zinc-200 text-lg text-center mb-8">Tell others a bit about yourself (optional).</p>
              <Button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white text-lg font-semibold shadow-lg"
                onClick={nextStep}
              >
                Next <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
          {step === 4 && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Pick your vibe color</h3>
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                {themeColors.map((color) => (
                  <button
                    key={color}
                    style={{ background: color }}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${profile.theme_color === color ? 'border-white ring-2 ring-sky-400 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    aria-label={`Select color ${color}`}
                    onClick={() => updateProfile({ theme_color: color })}
                  />
                ))}
              </div>
              <Button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white text-lg font-semibold shadow-lg"
                onClick={nextStep}
              >
                Next <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
          {step === 5 && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Looking good!</h3>
              <p className="text-zinc-200 text-lg text-center mb-8">Here's a preview of your profile. Ready to get started?</p>
              <motion.div 
                className="bg-zinc-900/50 backdrop-blur-lg rounded-2xl p-8 mb-10 border border-zinc-800/50 shadow-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center mb-6">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Avatar className="w-20 h-20 mr-5 border-2" style={{ borderColor: profile.theme_color }}>
                      <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.username || 'guest'}`} />
                      <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase() || 'VB'}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-bold">{profile.username}</h3>
                    <p className="text-zinc-200 text-sm">{user ? 'Member' : 'Guest User'}</p>
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-zinc-300">{profile.bio}</p>
                )}
                
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: profile.theme_color }}></div>
                    <p className="text-zinc-200 text-sm">Theme Color</p>
                  </div>
                </div>
              </motion.div>
              {error && (
                <motion.div 
                  className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-8 text-red-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
              <Button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white text-lg font-semibold shadow-lg relative overflow-hidden"
                onClick={saveProfile}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 animate-pulse"></div>
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Saving...
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/10 to-transparent skew-x-[-20deg] transform translate-x-20 group-hover:translate-x-0 transition-transform"></div>
                    Complete Setup <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
