'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-supabase-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { m, AnimatePresence } from 'framer-motion'
import { Mic, Music2, User, Sparkles, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type SupabaseClient } from '@supabase/supabase-js'

// Initialize supabase client lazily to prevent SSR issues
let supabaseClient: SupabaseClient | null = null;

// Function to get the Supabase client safely
const getSupabase = () => {
  if (typeof window === 'undefined') return null;
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient();
  }
  return supabaseClient;
}

const supabase = getSupabase();

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
}

const genreOptions = [
  'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic',
  'Jazz', 'Classical', 'Country', 'Latin', 'Metal'
]

const themeColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4'
]

export default function OnboardingForm() {
  const [[page, direction], setPage] = useState([0, 0])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    preferredGenres: [] as string[],
    themeColor: '#6366f1'
  })
  const totalSteps = 4
  const router = useRouter()
  const { user, isLoading: authLoading, createEmptyProfile, profile, setProfile } = useAuth()
  const [guestId, setGuestId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState('100vh')
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const initAttemptedRef = useRef(false)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle iOS viewport issues
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // iOS detection
    const checkIOSDevice = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOSDevice(isIOS);
      return isIOS;
    };

    // Set viewport height - fix for iOS
    const updateViewportHeight = () => {
      // Use a more reliable calculation for viewport height
      const vh = window.innerHeight;
      setViewportHeight(`${vh}px`);
      
      // Store it as a CSS variable for use in styled components
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      
      // Add a class to body for fixed positioning
      if (isIOSDevice) {
        document.body.classList.add('ios-fixed-body');
      }
    };

    const isIOS = checkIOSDevice();
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Longer timeout to ensure the browser has updated the viewport
      setTimeout(updateViewportHeight, 300);
    });

    // If iOS, add specific fixes for keyboard
    if (isIOS) {
      // Track when keyboard is open
      const handleFocus = () => {
        setKeyboardOpen(true);
        document.body.classList.add('ios-keyboard-open');
        // When keyboard opens, scroll to the focused element
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement) {
            // Scroll the active element into view
            activeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
          }
        }, 300);
      };
      
      const handleBlur = () => {
        setKeyboardOpen(false);
        document.body.classList.remove('ios-keyboard-open');
        // When keyboard closes, scroll back to top
        window.scrollTo(0, 0);
      };
      
      const inputElements = document.querySelectorAll('input, textarea');
      inputElements.forEach(el => {
        el.addEventListener('focus', handleFocus);
        el.addEventListener('blur', handleBlur);
      });
      
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        document.body.classList.remove('ios-fixed-body');
        document.body.classList.remove('ios-keyboard-open');
        
        inputElements.forEach(el => {
          el.removeEventListener('focus', handleFocus);
          el.removeEventListener('blur', handleBlur);
        });
      };
    }
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      document.body.classList.remove('ios-fixed-body');
    };
  }, []);

  // Debug state
  useEffect(() => {
    console.log('[Onboarding] loading:', loading, 'authLoading:', authLoading, 'user:', user, 'guestId:', guestId)
  }, [loading, authLoading, user, guestId])

  // Check for guest profile
  useEffect(() => {
    // Check if there's a guest session in localStorage
    const checkGuestSession = () => {
      try {
        const guestProfileId = localStorage.getItem('guestProfileId');
        if (guestProfileId) {
          console.log('[Onboarding] Found guest profile ID:', guestProfileId);
          setGuestId(guestProfileId);
        } else {
          console.log('[Onboarding] No guest profile ID found in localStorage');
        }
      } catch (err) {
        console.error('[Onboarding] Error checking guest session:', err);
      }
    };
    
    // Only check for guest session on the client
    if (typeof window !== 'undefined') {
      checkGuestSession();
    }
  }, [])

  useEffect(() => {
    // For more verbose debugging
    if (typeof window !== 'undefined') {
      // Add global debug function
      (window as any).debugOnboarding = {
        resetLoading: () => {
          setLoading(false);
          console.log('Forced loading state reset via debug function');
        },
        getState: () => {
          return {
            loading,
            authLoading,
            user,
            guestId,
            formData,
            keyboardOpen,
            errorMessage
          };
        }
      };
    }
  }, [loading, authLoading, user, guestId, formData, keyboardOpen, errorMessage]);

  useEffect(() => {
    // Full check for both auth methods with explicit loading state
    const isFullyLoaded = !authLoading && !loading;
    const hasAuthMethod = !!user || !!guestId;
    
    console.log('[Onboarding] Auth check - isFullyLoaded:', isFullyLoaded, 
      'user:', !!user, 'guestId:', !!guestId, 'hasAuthMethod:', hasAuthMethod);

    // Check for just authenticated flag
    const checkJustAuthenticated = () => {
      if (typeof window === 'undefined') return false;
      const justAuth = localStorage.getItem('justAuthenticated') === 'true';
      if (justAuth) {
        console.log('[Onboarding] User just authenticated, clearing flag');
        localStorage.removeItem('justAuthenticated');
      }
      return justAuth;
    };
    
    const justAuthenticated = checkJustAuthenticated();

    // If loaded and no auth methods found, redirect with delay
    if (isFullyLoaded && !hasAuthMethod && !justAuthenticated) {
      console.warn('[Onboarding] No authentication found after loading completed');
      
      // Use a longer delay to account for possible localStorage/auth initialization
      const redirectTimeout = setTimeout(() => {
        // Final check before redirecting
        const finalUser = user;
        const finalGuestId = localStorage.getItem('guestProfileId');
        
        if (!finalUser && !finalGuestId) {
          console.warn('[Onboarding] Final check confirms no auth - redirecting to signin');
          window.location.href = '/auth/signin'; // Use direct navigation for reliability
        } else {
          // If we find auth by the final check, update state and cancel redirect
          console.log('[Onboarding] Auth detected in final check - cancelling redirect');
          if (finalGuestId && !guestId) {
            setGuestId(finalGuestId); // Update state if guest ID was found
          }
        }
      }, 1500); // Longer delay to ensure all async operations complete
      
      return () => clearTimeout(redirectTimeout);
    }
    
    // If we have an auth method or just authenticated, initialize profile
    if ((isFullyLoaded && hasAuthMethod) || justAuthenticated) {
      // If user just authenticated, give a little extra time for Supabase session to be fully established
      const initDelay = justAuthenticated ? 500 : 0;
      setTimeout(() => {
        console.log('[Onboarding] Initializing profile after auth check');
        initializeProfile();
      }, initDelay);
    }
  }, [authLoading, loading, user, guestId]);

  // Add safety timeout to ensure we don't get stuck loading forever
  useEffect(() => {
    // Only set a safety timeout on the client
    if (typeof window === 'undefined') return;
    
    // Create a safety timeout to prevent indefinite loading
    safetyTimeoutRef.current = setTimeout(() => {
      console.log('[Onboarding] Safety timeout triggered - forcing loading=false');
      setLoading(false);
      
      // Only show error if we attempted initialization but it didn't complete
      if (initAttemptedRef.current) {
        setErrorMessage('The profile took too long to load. Please try refreshing the page.');
      }
    }, 10000); // 10 second safety timeout
    
    return () => {
      // Clean up the timeout
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []);

  // Move initializeProfile outside the effect for clarity
  const initializeProfile = async () => {
    try {
      console.log('[Onboarding] Starting initializeProfile, setting loading=true');
      setLoading(true);
      
      // Get the Supabase client
      const supabase = getSupabase();
      if (!supabase) {
        console.error('[Onboarding] Failed to initialize Supabase client');
        setErrorMessage('Could not connect to the database. Please try again later.');
        setLoading(false);
        return;
      }
      
      // Get the most up-to-date values directly
      const currentUser = user;
      const currentGuestId = guestId || localStorage.getItem('guestProfileId');
      
      console.log('[Onboarding] Auth info - user:', !!currentUser, 'guestId:', !!currentGuestId);
      
      // Force loading to false if we don't have any auth method
      if (!currentUser && !currentGuestId) {
        console.warn('[Onboarding] No auth method found, stopping initialization');
        setErrorMessage('Could not determine your identity. Please try signing in again.');
        setLoading(false);
        return;
      }
      
      // Determine which ID to use (authenticated or guest)
      const profileId = currentUser?.id || currentGuestId;
      if (!profileId) {
        console.error('[Onboarding] No profile ID available, aborting');
        setErrorMessage('Could not determine your identity. Please try signing in again.');
        setLoading(false);
        return;
      }
      
      console.log('[Onboarding] Using profile ID:', profileId, 'isGuest:', !currentUser, 'isUser:', !!currentUser);
      
      // First check if the profile exists
      console.log('[Onboarding] Checking if profile exists...');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
      
      if (error) {
        console.error('[Onboarding] Error checking profile:', error);
        setErrorMessage(`Error checking profile: ${error.message}`);
        setLoading(false);
        return;
      }
      
      // If no profile exists, create an empty one
      if (!profile) {
        console.log('[Onboarding] No profile found, creating empty profile');
        try {
          // Use the createEmptyProfile from useAuth which handles proper profile creation
          if (currentUser) {
            console.log('[Onboarding] Creating profile for user', currentUser.id);
            try {
              await createEmptyProfile(currentUser.id);
              console.log('[Onboarding] Created empty profile for user:', currentUser.id);
            } catch (createError) {
              console.error('[Onboarding] Error in createEmptyProfile:', createError);
              setErrorMessage(`Error creating profile: ${String(createError)}`);
              setLoading(false);
              return;
            }
          } else if (currentGuestId) {
            // For guest profiles, create directly
            console.log('[Onboarding] Creating guest profile');
            try {
              const { error: insertError } = await supabase.from('profiles').insert({
                id: currentGuestId,
                username: `guest_${Date.now().toString(36)}`,
                display_name: 'Guest User',
                is_guest: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
              if (insertError) {
                console.error('[Onboarding] Error inserting guest profile:', insertError);
                setErrorMessage(`Error creating guest profile: ${insertError.message}`);
                setLoading(false);
                return;
              }
              
              console.log('[Onboarding] Created guest profile for:', currentGuestId);
            } catch (insertError) {
              console.error('[Onboarding] Exception inserting guest profile:', insertError);
              setErrorMessage(`Error creating guest profile: ${String(insertError)}`);
              setLoading(false);
              return;
            }
          }
          
          // Re-fetch the newly created profile
          console.log('[Onboarding] Fetching newly created profile');
          try {
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', profileId)
              .single();
            
            if (newProfileError) {
              console.error('[Onboarding] Error fetching new profile:', newProfileError);
              setErrorMessage(`Error fetching your profile: ${newProfileError.message}`);
              setLoading(false);
              return;
            }
            
            if (!newProfile) {
              console.error('[Onboarding] New profile is null after creation');
              setErrorMessage('Error creating your profile. Profile not found after creation.');
              setLoading(false);
              return;
            }
            
            console.log('[Onboarding] Created new profile:', newProfile);
            
            // Pre-fill form with data from the new profile
            setFormData(prevData => ({
              ...prevData,
              username: newProfile.username || '',
              displayName: newProfile.display_name || '',
              bio: newProfile.bio || '',
              preferredGenres: newProfile.preferred_genres || [],
              themeColor: newProfile.theme_color || '#6366f1'
            }));
          } catch (fetchError) {
            console.error('[Onboarding] Exception fetching new profile:', fetchError);
            setErrorMessage(`Error retrieving your profile: ${String(fetchError)}`);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('[Onboarding] Error creating profile:', err);
          setErrorMessage('Failed to initialize your profile. Please try again or sign out and sign back in.');
          setLoading(false);
          return;
        }
      } else {
        console.log('[Onboarding] Found existing profile:', profile);
        
        // Check if user has already completed onboarding
        if (profile.onboarded) {
          console.log('[Onboarding] User already completed onboarding, redirecting to /directory');
          window.location.href = '/directory'; // Use direct navigation
          return;
        }
        
        // Pre-fill form with existing profile data
        setFormData(prevData => ({
          ...prevData,
          username: profile.username || '',
          displayName: profile.display_name || '',
          bio: profile.bio || '',
          preferredGenres: profile.preferred_genres || [],
          themeColor: profile.theme_color || '#6366f1'
        }));
      }
      
      // Set loading to false at the end if we got here successfully
      console.log('[Onboarding] Profile initialization completed successfully');
      setLoading(false);
    } catch (err) {
      console.error('[Onboarding] Error in initializeProfile:', err);
      setErrorMessage(`Something went wrong: ${String(err)}`);
      setLoading(false);
    } finally {
      console.log('[Onboarding] initializeProfile complete, setting loading=false');
      setLoading(false);
      initAttemptedRef.current = true;
    }
  };

  // Helper to move between steps
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection])
  }
  
  const handleNext = () => {
    paginate(1)
  }
  
  const handleBack = () => {
    paginate(-1)
  }
  
  // Final submit handler
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      
      // Get the Supabase client
      const supabase = getSupabase();
      if (!supabase) {
        console.error('[Onboarding] Failed to initialize Supabase client');
        setErrorMessage('Could not connect to the database. Please try again later.');
        setSubmitting(false);
        return;
      }
      
      // Get the right ID (authenticated or guest)
      const profileId = user?.id || guestId;
      
      if (!profileId) {
        throw new Error('No profile ID available');
      }
      
      // Prepare data for the database (convert camelCase to snake_case)
      const profileData = {
        username: formData.username,
        display_name: formData.displayName,
        bio: formData.bio || '',
        preferred_genres: formData.preferredGenres,
        theme_color: formData.themeColor,
        onboarded: true,
        updated_at: new Date().toISOString()
      };
      
      console.log('[Onboarding] Submitting profile data:', profileData);
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profileId);
      
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      toast.success('Profile updated successfully');
      
      // Update local state to match database
      if (profile) {
        const updatedProfile = {
          ...profile,
          ...profileData
        };
        setProfile(updatedProfile);
      }
      
      // Wait a moment before redirect to allow toast to show
      setTimeout(() => {
        // Redirect to the directory page
        console.log('[Onboarding] Redirecting to directory page...');
        window.location.href = '/directory';
      }, 1000);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setErrorMessage('Failed to update your profile. Please try again.');
      toast.error('Something went wrong while updating your profile');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render the current step
  const renderStep = () => {
    // Show loading state
    if (loading || authLoading) {
      console.log('[Onboarding] Rendering loading state - loading:', loading, 'authLoading:', authLoading);
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
          <p className="text-white/70 text-sm mb-4">Loading your profile...</p>
          
          {/* Add a skip button that appears after 5 seconds */}
          {initAttemptedRef.current && (
            <Button 
              onClick={() => {
                console.log('[Onboarding] User manually skipped loading');
                setLoading(false);
                // Create an empty form state
                setFormData({
                  username: '',
                  displayName: '',
                  bio: '',
                  preferredGenres: [],
                  themeColor: '#6366f1'
                });
              }}
              variant="outline"
              className="mt-4 text-xs bg-zinc-800/50 hover:bg-zinc-700/50 text-white/60"
            >
              Continue without loading
            </Button>
          )}
        </div>
      )
    }
    
    // Show error message if any
    if (errorMessage) {
      return (
        <div className="text-center p-6 rounded-lg bg-red-500/10 border border-red-500/20">
          <h2 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-white/80 mb-4">{errorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push('/auth/signin')}
              variant="outline"
              className="bg-white/5 hover:bg-white/10 text-white border-white/20"
            >
              Go back to sign in
            </Button>
            <Button
              onClick={() => {
                setErrorMessage(null);
                setLoading(false);
                // Provide a fresh start with empty form
                setFormData({
                  username: '',
                  displayName: '',
                  bio: '',
                  preferredGenres: [],
                  themeColor: '#6366f1'
                });
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start fresh
            </Button>
          </div>
        </div>
      )
    }
    
    // Onboarding steps
    const content = [
      // Step 1: Welcome
      <m.div 
        key="welcome" 
        className="px-4 py-8 md:p-8 backdrop-blur-sm bg-white/[0.03] rounded-xl border border-white/10 max-w-xl mx-auto ios-form-padding"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Vibe</h1>
          <p className="text-gray-400">Let's set up your profile in a few quick steps</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="mr-4 text-purple-400">
              <User className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-medium">Create your identity</h2>
              <p className="text-sm text-gray-400">Choose your username and profile info</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="mr-4 text-pink-400">
              <Music2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-medium">Select your interests</h2>
              <p className="text-sm text-gray-400">Help us personalize your experience</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="mr-4 text-indigo-400">
              <Mic className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-medium">Customize your appearance</h2>
              <p className="text-sm text-gray-400">Choose colors and themes you prefer</p>
            </div>
          </div>
        </div>
      </m.div>,
      
      // Step 2: Username and basics
      <m.div 
        key="basics" 
        className="px-4 py-8 md:p-8 backdrop-blur-sm bg-white/[0.03] rounded-xl border border-white/10 max-w-xl mx-auto ios-form-padding"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Your Identity</h1>
          <p className="text-gray-400">How others will recognize you</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ios-form-input"
              placeholder="Your unique username"
              maxLength={30}
              aria-required="true"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.username.length}/30 characters
            </p>
          </div>
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ios-form-input"
              placeholder="Your public display name"
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
              Bio <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-24 ios-form-input"
              placeholder="A short description about yourself"
            />
          </div>
        </div>
      </m.div>,
      
      // Step 3: Musical preferences
      <m.div 
        key="genres" 
        className="px-4 py-8 md:p-8 backdrop-blur-sm bg-white/[0.03] rounded-xl border border-white/10 max-w-xl mx-auto ios-form-padding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Your Interests</h1>
          <p className="text-gray-400">Select music genres you enjoy</p>
        </div>
        
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((genre) => (
              <m.button
                key={genre}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const currentGenres = formData.preferredGenres;
                  const updated = currentGenres.includes(genre)
                    ? currentGenres.filter(g => g !== genre)
                    : [...currentGenres, genre];
                  
                  setFormData({...formData, preferredGenres: updated});
                  
                  // Add haptic feedback for iOS
                  if (window.navigator.vibrate) window.navigator.vibrate(3);
                }}
                className={cn(
                  "py-2 px-4 rounded-full text-sm transition-all ios-touch-fix",
                  formData.preferredGenres.includes(genre)
                    ? "bg-purple-500 text-white"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                )}
              >
                {genre}
              </m.button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          {formData.preferredGenres.length 
            ? `Selected: ${formData.preferredGenres.length} genres` 
            : "Select at least one genre to continue"
          }
        </div>
      </m.div>,
      
      // Step 4: Theme selection
      <m.div 
        key="theme" 
        className="px-4 py-8 md:p-8 backdrop-blur-sm bg-white/[0.03] rounded-xl border border-white/10 max-w-xl mx-auto ios-form-padding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Choose Your Style</h1>
          <p className="text-gray-400">Select a theme color that represents you</p>
        </div>
        <m.div 
          className="grid grid-cols-4 gap-3 max-w-xs mx-auto mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {themeColors.map((color) => (
            <m.button
              key={color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setFormData({ ...formData, themeColor: color })
                if (window.navigator.vibrate) window.navigator.vibrate(3)
                
                // Automatically submit the form after selecting a theme color
                if (page === totalSteps - 1) {
                  setTimeout(() => {
                    handleSubmit();
                  }, 300);
                }
              }}
              className={cn(
                "w-12 h-12 rounded-full transition-transform ios-touch-fix",
                formData.themeColor === color && "ring-2 ring-white ring-offset-2 ring-offset-black"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </m.div>
      </m.div>
    ]

    return (
      <AnimatePresence mode="wait" custom={direction}>
        <m.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full"
        >
          {content[page]}
        </m.div>
      </AnimatePresence>
    )
  }

  return (
    <div 
      className={cn(
        "bg-black text-white ios-safe-area",
        keyboardOpen ? "ios-keyboard-active" : ""
      )}
      style={{
        height: isIOSDevice ? viewportHeight : '100vh',
        maxHeight: isIOSDevice ? viewportHeight : '100vh',
        overflow: 'hidden',
        position: isIOSDevice ? 'fixed' : 'relative',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%'
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto ios-scroll-fix pb-[70px]">
          <div className="max-w-4xl mx-auto px-4 py-8 pt-safe">
            <div className="relative">
              {renderStep()}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 pb-safe">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              onClick={handleBack}
              disabled={page === 0 || submitting}
              variant="outline"
              className="text-white hover:bg-white/10 border-white/20 ios-touch-fix px-5 py-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <m.div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === page ? "bg-purple-500" : "bg-white/20"
                  )}
                  initial={false}
                  animate={{
                    scale: i === page ? 1.2 : 1,
                    opacity: i === page ? 1 : 0.5
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              ))}
            </div>

            <Button
              onClick={page === totalSteps - 1 ? handleSubmit : handleNext}
              disabled={submitting || (page === 1 && !formData.username)}
              variant={page === totalSteps - 1 ? "default" : "secondary"}
              className={cn(
                "min-w-[100px] transition-all ios-touch-fix px-5 py-3",
                page === totalSteps - 1 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              )}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : page === totalSteps - 1 ? (
                'Finish'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
