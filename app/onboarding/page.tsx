'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-supabase-auth';
import { ArrowLeft, ArrowRight, Sparkles, Check, User, Palette, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Haptic feedback function
const vibrate = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Vibration API not supported');
    }
  }
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0); // Start with welcome screen (step 0)
  const [totalSteps] = useState(4);
  const [profile, setProfile] = useState({
    id: '',
    username: '',
    avatar_url: '',
    bio: '',
    theme_color: '#38bdf8',
    is_guest: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user, profile: authProfile, guestId } = useAuth();

  // Available theme colors
  const themeColors = [
    '#38bdf8', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#6366f1', // Indigo
  ];

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true);
    checkProfile();
  }, []);

  // Check if user already has a profile
  const checkProfile = async () => {
    try {
      if (!isClient) return;
      
      // Determine the user ID (authenticated or guest)
      const currentUserId = user?.id || guestId;
      
      if (!currentUserId) {
        // No user ID found, redirect to home
        router.push('/');
        return;
      }
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();
        
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
          theme_color: profileData.theme_color || '#38bdf8',
          is_guest: profileData.is_guest || true
        });
      } else if (authProfile && authProfile.id) {
        // Use auth profile if available
        setProfile({
          id: authProfile.id,
          username: authProfile.username || '',
          avatar_url: authProfile.avatar_url || '',
          bio: authProfile.bio || '',
          theme_color: authProfile.theme_color || '#38bdf8',
          is_guest: authProfile.is_guest || false
        });
      }
    } catch (err) {
      console.error('Error checking profile:', err);
    }
  };

  const nextStep = () => {
    setDirection('forward');
    vibrate(10);
    setStep(prev => Math.min(prev + 1, totalSteps + 1));
  };

  const prevStep = () => {
    setDirection('back');
    vibrate(10);
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
      const currentUserId = user?.id || guestId || profile.id;
      
      if (!currentUserId) {
        setError('User ID not found');
        return;
      }
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          theme_color: profile.theme_color,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(updateError.message);
        return;
      }
      
      // Show success message
      toast.success('Profile created successfully!');
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: (direction: string) => ({
      x: direction === 'forward' ? '100%' : '-100%',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: string) => ({
      x: direction === 'forward' ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  // Welcome screen animation variants
  const welcomeVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  // Render loading state if not on client yet
  if (!isClient) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-pulse text-indigo-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex flex-col">
      <AnimatePresence mode="wait" custom={direction}>
        {step === 0 && (
          <motion.div
            key="welcome-screen"
            className="flex-1 flex flex-col items-center justify-center p-6"
            variants={welcomeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div 
              className="w-24 h-24 mb-8 relative"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-30 blur-xl" />
              <div className="relative w-full h-full flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Welcome to VIBE
            </h1>
            
            <p className="text-lg text-zinc-300 mb-10 text-center max-w-md">
              Let's set up your profile so you can start connecting with others in real-time audio and video rooms.
            </p>
            
            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 rounded-lg text-lg font-medium"
            >
              Get Started
            </Button>
          </motion.div>
        )}

        {step > 0 && (
          <motion.div
            key="onboarding-container"
            className="flex-1 flex flex-col max-w-md mx-auto w-full p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-10">
              <motion.div
                initial={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
                animate={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
            
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Username */}
              {step === 1 && (
                <motion.div
                  key="username-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-4">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Choose a username</h2>
                  </div>
                  
                  <p className="text-zinc-400 mb-8">
                    This is how others will identify you in rooms and conversations.
                  </p>
                  
                  <div className="mb-8">
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={profile.username}
                      onChange={(e) => updateProfile({ username: e.target.value })}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 py-6 text-lg"
                      autoFocus
                    />
                    {profile.username.length > 0 && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-green-400 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-1" /> Looks good!
                      </motion.p>
                    )}
                  </div>
                  
                  <div className="mt-auto flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="text-zinc-400"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!profile.username.trim()}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 2: Avatar */}
              {step === 2 && (
                <motion.div
                  key="avatar-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Choose an avatar</h2>
                  </div>
                  
                  <p className="text-zinc-400 mb-8">
                    Select an avatar that represents you.
                  </p>
                  
                  <div className="flex flex-col items-center mb-8">
                    <Avatar className="w-32 h-32 mb-6 border-2 border-purple-500/30">
                      <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.username || 'guest'}`} />
                      <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase() || 'VB'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="grid grid-cols-4 gap-3 w-full">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div 
                          key={i}
                          className={`w-full aspect-square rounded-full overflow-hidden cursor-pointer border-2 transition-all ${
                            profile.avatar_url === `https://api.dicebear.com/6.x/avataaars/svg?seed=${i}` 
                              ? 'border-purple-500 scale-110' 
                              : 'border-transparent hover:border-purple-500/50'
                          }`}
                          onClick={() => updateProfile({ avatar_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${i}` })}
                        >
                          <img 
                            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${i}`} 
                            alt={`Avatar option ${i+1}`}
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="text-zinc-400"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 3: Bio */}
              {step === 3 && (
                <motion.div
                  key="bio-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center mr-4">
                      <MessageSquare className="w-5 h-5 text-pink-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Add a bio</h2>
                  </div>
                  
                  <p className="text-zinc-400 mb-8">
                    Tell others a bit about yourself (optional).
                  </p>
                  
                  <div className="mb-8">
                    <Textarea
                      placeholder="I'm interested in..."
                      value={profile.bio}
                      onChange={(e) => updateProfile({ bio: e.target.value })}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[120px] resize-none"
                    />
                    <p className="mt-2 text-zinc-500 text-sm">
                      {profile.bio.length}/160 characters
                    </p>
                  </div>
                  
                  <div className="mt-auto flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="text-zinc-400"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 4: Theme */}
              {step === 4 && (
                <motion.div
                  key="theme-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                      <Palette className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Choose a theme</h2>
                  </div>
                  
                  <p className="text-zinc-400 mb-8">
                    Select a color that matches your vibe.
                  </p>
                  
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    {themeColors.map((color) => (
                      <div
                        key={color}
                        className={`aspect-square rounded-full cursor-pointer transition-all ${
                          profile.theme_color === color 
                            ? 'ring-4 ring-offset-2 ring-offset-zinc-900 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateProfile({ theme_color: color })}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-auto flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="text-zinc-400"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 5: Confirmation */}
              {step === 5 && (
                <motion.div
                  key="confirmation-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Looking good!</h2>
                  </div>
                  
                  <p className="text-zinc-400 mb-8">
                    Here's a preview of your profile. Ready to get started?
                  </p>
                  
                  <div className="bg-zinc-800/50 rounded-xl p-6 mb-8 border border-zinc-700/50">
                    <div className="flex items-center mb-6">
                      <Avatar className="w-16 h-16 mr-4 border-2" style={{ borderColor: profile.theme_color }}>
                        <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.username || 'guest'}`} />
                        <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase() || 'VB'}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="text-xl font-bold">{profile.username}</h3>
                        <p className="text-zinc-400 text-sm">{profile.is_guest ? 'Guest User' : 'Member'}</p>
                      </div>
                    </div>
                    
                    {profile.bio && (
                      <p className="text-zinc-300 text-sm">{profile.bio}</p>
                    )}
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
                      {error}
                    </div>
                  )}
                  
                  <div className="mt-auto flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="text-zinc-400"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={saveProfile}
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Bottom navigation hints */}
            {step > 0 && step < 5 && (
              <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between text-zinc-500 text-xs">
                <p className="flex items-center">
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back
                </p>
                <p className="flex items-center">
                  Continue <ArrowRight className="w-3 h-3 ml-1" />
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
