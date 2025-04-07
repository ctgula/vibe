'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UsernameStep } from '@/components/onboarding/UsernameStep';
import { AvatarStep } from '@/components/onboarding/AvatarStep';
import { BioStep } from '@/components/onboarding/BioStep';
import { ThemeStep } from '@/components/onboarding/ThemeStep';
import { ConfirmationStep } from '@/components/onboarding/ConfirmationStep';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useAuth } from '@/hooks/use-supabase-auth';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

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
  const [step, setStep] = useState(1);
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
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true);
    
    // Check if user already has a profile
    const checkProfile = async () => {
      try {
        const guestProfileId = localStorage.getItem('guestProfileId');
        
        if (guestProfileId) {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', guestProfileId)
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
          }
        } else if (auth.profile && auth.profile.id) {
          // Use auth profile if available
          setProfile({
            id: auth.profile.id,
            username: auth.profile.username || '',
            avatar_url: auth.profile.avatar_url || '',
            bio: auth.profile.bio || '',
            theme_color: auth.profile.theme_color || '#38bdf8',
            is_guest: auth.profile.is_guest || true
          });
        }
      } catch (err) {
        console.error('Error checking profile:', err);
      } finally {
        // After checking the profile, hide welcome screen
        setTimeout(() => {
          setShowWelcomeScreen(false);
        }, 2000);
      }
    };
    
    checkProfile();
  }, [router, auth.profile]);

  // Swipe gestures for navigation - only enable on client
  const handleSwipeLeft = useCallback(() => {
    if (step < totalSteps + 1 && !showWelcomeScreen && isClient) {
      nextStep();
    }
  }, [step, totalSteps, showWelcomeScreen, isClient]);

  const handleSwipeRight = useCallback(() => {
    if (step > 1 && !showWelcomeScreen && isClient) {
      prevStep();
    }
  }, [step, showWelcomeScreen, isClient]);

  useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
    velocityThreshold: 0.3
  });

  const nextStep = () => {
    if (step < totalSteps + 1) {
      setDirection('forward');
      if (isClient) vibrate(10); // Subtle haptic feedback
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection('back');
      if (isClient) vibrate(5); // Even more subtle haptic feedback for back
      setStep(step - 1);
    }
  };

  const updateProfile = (data: Partial<typeof profile>) => {
    // Subtle feedback when updating profile
    if (isClient) vibrate([5, 10, 5]);
    setProfile({ ...profile, ...data });
  };

  const handleUsernameUpdate = (username: string) => {
    updateProfile({ username });
  };

  const handleAvatarUpdate = (avatar_url: string) => {
    updateProfile({ avatar_url });
  };

  const handleBioUpdate = (bio: string) => {
    updateProfile({ bio });
  };

  const handleThemeUpdate = (theme_color: string) => {
    updateProfile({ theme_color });
  };

  const saveProfile = async () => {
    if (!isClient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Stronger vibration for completing the onboarding
      vibrate([10, 30, 10, 30]);
      
      // Check if we have an ID (existing profile)
      if (!profile.id) {
        // Generate a new UUID for the profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            username: profile.username,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            theme_color: profile.theme_color,
            is_guest: true, // Mark as guest profile
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        if (newProfile) {
          // Save the profile ID to localStorage
          localStorage.setItem('guestProfileId', newProfile.id);
          setProfile({ ...profile, id: newProfile.id });
        }
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: profile.username,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            theme_color: profile.theme_color,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
          
        if (updateError) throw updateError;
      }
      
      // Short delay before redirecting for a smoother experience
      setTimeout(() => {
        // Redirect to home page
        router.push('/');
      }, 800);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      // Error vibration pattern
      vibrate([100, 50, 100]);
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
      scale: 0.9
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <AnimatePresence mode="wait">
        {showWelcomeScreen ? (
          <motion.div
            key="welcome-screen"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={welcomeVariants}
            className="max-w-md w-full p-6 rounded-2xl bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-2xl font-bold text-white mb-3"
            >
              Welcome to Vibe
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-zinc-300 mb-6"
            >
              Let's set up your profile in just a few steps
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="onboarding-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full p-6 rounded-2xl bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl"
          >
            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-8 overflow-hidden">
              <motion.div
                initial={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
                animate={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
            
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="username-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <UsernameStep 
                    username={profile.username}
                    onUpdate={handleUsernameUpdate}
                    onNext={nextStep}
                  />
                </motion.div>
              )}
              
              {step === 2 && (
                <motion.div
                  key="avatar-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <AvatarStep 
                    avatarUrl={profile.avatar_url}
                    onUpdate={handleAvatarUpdate}
                    onNext={nextStep}
                    onBack={prevStep}
                  />
                </motion.div>
              )}
              
              {step === 3 && (
                <motion.div
                  key="bio-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <BioStep 
                    bio={profile.bio}
                    onUpdate={handleBioUpdate}
                    onNext={nextStep}
                    onBack={prevStep}
                  />
                </motion.div>
              )}
              
              {step === 4 && (
                <motion.div
                  key="theme-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <ThemeStep 
                    themeColor={profile.theme_color}
                    onUpdate={handleThemeUpdate}
                    onNext={nextStep}
                    onBack={prevStep}
                  />
                </motion.div>
              )}
              
              {step === 5 && (
                <motion.div
                  key="confirmation-step"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <ConfirmationStep 
                    profile={profile}
                    onSave={saveProfile}
                    onBack={prevStep}
                    loading={loading}
                    error={error}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Bottom navigation hints */}
            <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between text-zinc-500 text-xs">
              {step > 1 ? (
                <p className="flex items-center">
                  <ArrowLeft className="w-3 h-3 mr-1" /> Swipe right to go back
                </p>
              ) : (
                <div></div>
              )}
              
              {step < 5 && (
                <p className="flex items-center">
                  Swipe left to continue <ArrowRight className="w-3 h-3 ml-1" />
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
