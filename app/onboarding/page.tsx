'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [totalSteps] = useState(4);
  const [profile, setProfile] = useState({
    id: '',
    username: '',
    display_name: '',
    avatar_url: '',
    bio: '',
    theme_color: '#6366f1',
    is_guest: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const router = useRouter();
  const { user, profile: authProfile, guestId } = useAuth();

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get the user ID from the authenticated user
        let currentUserId = user?.id;

        // If no authenticated user, try to get the guest ID
        if (!currentUserId) {
          const storedGuestId = localStorage.getItem('guestProfileId') || localStorage.getItem('guest_id');
          if (storedGuestId) {
            currentUserId = storedGuestId;
          }
        }

        if (!currentUserId) {
          // No user ID found, redirect back to welcome page
          router.push('/');
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setProfile({
            id: profileData.id,
            username: profileData.username || '',
            display_name: profileData.display_name || '',
            avatar_url: profileData.avatar_url || '',
            bio: profileData.bio || '',
            theme_color: profileData.theme_color || '#6366f1',
            is_guest: profileData.is_guest || false,
          });
        } else {
          // If no profile found, initialize with current user ID
          setProfile(prev => ({
            ...prev,
            id: currentUserId,
            is_guest: !user?.id,
          }));
        }
      } catch (err) {
        console.error('Error initializing profile:', err);
        setError('Error loading profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [user, guestId, router]);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      // Apply haptic feedback
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      setDirection('forward');
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      // Apply haptic feedback
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      setDirection('back');
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!profile.id) {
        throw new Error('No profile ID found');
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name || profile.username,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          theme_color: profile.theme_color,
          is_guest: profile.is_guest,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      // Apply haptic feedback for success
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 10, 3]);
      }
      
      // Add delay before navigation for a better user experience
      setTimeout(() => {
        router.push('/directory');
      }, 50);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving profile. Please try again.');
      
      // Apply haptic feedback for error
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([10, 5, 10, 5, 10]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490]">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-8 text-red-300"
        >
          {error}
        </motion.div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] px-4 py-safe-top pb-safe-bot"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Onboarding content */}
      <motion.div
        key={step}
        initial={{ x: direction === 'forward' ? 100 : -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction === 'forward' ? -100 : 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md"
      >
        {/* Step content here */}
        {/* You can add your step components here */}
      </motion.div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-black/50 backdrop-blur-lg border-t border-white/10">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <div className="text-white">
          Step {step + 1} of {totalSteps}
        </div>
        {step === totalSteps - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </motion.div>
  );
}
