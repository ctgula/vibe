'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth';
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
  const [isClient, setIsClient] = useState(false);
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
      const currentUserId = user?.id || guestId || profile.id;
      
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

  // Render loading state if not on client yet
  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-indigo-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-indigo-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-purple-900/20 to-transparent" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Logo className="mb-6" />
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 md:py-24"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                className="mb-10"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                  <Logo className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Welcome to VIBE
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-300 mb-10 md:mb-12 text-center max-w-lg">
                Let's set up your profile so you can start connecting with others in real-time.
              </p>
              
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 md:px-10 py-6 md:py-7 rounded-xl text-lg md:text-xl font-medium"
                >
                  Get Started
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step > 0 && (
            <motion.div
              key="onboarding-container"
              className="flex-1 flex flex-col max-w-xl mx-auto w-full p-4 md:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Progress bar */}
              <div className="w-full h-1 bg-zinc-800/50 rounded-full overflow-hidden mb-8 md:mb-12">
                <motion.div
                  initial={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
                  animate={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
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
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      Choose a username
                    </h2>
                    
                    <p className="text-zinc-400 mb-10 text-lg">
                      This is how others will identify you in rooms and conversations.
                    </p>
                    
                    <div className="mb-10">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter username"
                          value={profile.username}
                          onChange={(e) => updateProfile({ username: e.target.value })}
                          className="bg-zinc-900/70 border-zinc-700/50 text-white placeholder:text-zinc-500 py-7 text-xl px-6 rounded-xl"
                          autoFocus
                        />
                        {profile.username.length > 0 && (
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-black" />
                            </motion.div>
                          </div>
                        )}
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ 
                          opacity: profile.username.length > 0 ? 1 : 0,
                          height: profile.username.length > 0 ? 'auto' : 0
                        }}
                        className="mt-3 text-green-400 flex items-center overflow-hidden"
                      >
                        <Check className="w-4 h-4 mr-1" /> Looking good!
                      </motion.div>
                    </div>
                    
                    <div className="mt-auto">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full"
                      >
                        <Button
                          onClick={nextStep}
                          disabled={!profile.username.trim()}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl"
                        >
                          Continue
                        </Button>
                      </motion.div>
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
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      Choose an avatar
                    </h2>
                    
                    <p className="text-zinc-400 mb-10 text-lg">
                      Select an avatar that represents you.
                    </p>
                    
                    <div className="flex flex-col items-center mb-10">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Avatar className="w-40 h-40 mb-8 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                          <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.username || 'guest'}`} />
                          <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase() || 'VB'}</AvatarFallback>
                        </Avatar>
                      </motion.div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
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
                    </div>
                    
                    <div className="mt-auto flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 py-6 text-lg rounded-xl"
                      >
                        Back
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1"
                      >
                        <Button
                          onClick={nextStep}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl"
                        >
                          Continue
                        </Button>
                      </motion.div>
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
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      Add a bio
                    </h2>
                    
                    <p className="text-zinc-400 mb-10 text-lg">
                      Tell others a bit about yourself (optional).
                    </p>
                    
                    <div className="mb-10">
                      <Textarea
                        placeholder="I'm interested in..."
                        value={profile.bio}
                        onChange={(e) => updateProfile({ bio: e.target.value })}
                        className="bg-zinc-900/70 border-zinc-700/50 text-white placeholder:text-zinc-500 min-h-[150px] resize-none rounded-xl text-lg p-6"
                      />
                      <p className="mt-3 text-zinc-500 text-sm">
                        {profile.bio.length}/160 characters
                      </p>
                    </div>
                    
                    <div className="mt-auto flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 py-6 text-lg rounded-xl"
                      >
                        Back
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1"
                      >
                        <Button
                          onClick={nextStep}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl"
                        >
                          Continue
                        </Button>
                      </motion.div>
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
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      Choose a theme
                    </h2>
                    
                    <p className="text-zinc-400 mb-10 text-lg">
                      Select a color that matches your vibe.
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-10">
                      {themeColors.map((color) => (
                        <motion.div
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`aspect-square rounded-xl cursor-pointer transition-all ${
                            profile.theme_color === color 
                              ? 'ring-4 ring-offset-4 ring-offset-black scale-110' 
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            console.log('Setting theme color to:', color);
                            updateProfile({ theme_color: color });
                          }}
                          tabIndex={0}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-auto flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 py-6 text-lg rounded-xl"
                      >
                        Back
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1"
                      >
                        <Button
                          onClick={nextStep}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl"
                        >
                          Continue
                        </Button>
                      </motion.div>
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
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      Looking good!
                    </h2>
                    
                    <p className="text-zinc-400 mb-10 text-lg">
                      Here's a preview of your profile. Ready to get started?
                    </p>
                    
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
                          <p className="text-zinc-400 text-sm">{profile.is_guest ? 'Guest User' : 'Member'}</p>
                        </div>
                      </div>
                      
                      {profile.bio && (
                        <p className="text-zinc-300">{profile.bio}</p>
                      )}
                      
                      <div className="mt-6 pt-6 border-t border-zinc-800">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: profile.theme_color }}></div>
                          <p className="text-zinc-400 text-sm">Theme Color</p>
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
                    
                    <div className="mt-auto flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 py-6 text-lg rounded-xl"
                      >
                        Back
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1"
                      >
                        <Button
                          onClick={saveProfile}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl relative overflow-hidden"
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
