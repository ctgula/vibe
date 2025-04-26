'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-supabase-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { m, AnimatePresence } from 'framer-motion'
import { Mic, Music2, User, Sparkles, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const supabase = createClientComponentClient()

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
  const { user, isLoading: authLoading, createEmptyProfile } = useAuth()
  const [guestId, setGuestId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState('100vh')
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  // Handle iOS viewport issues
  useEffect(() => {
    // iOS detection
    const checkIOSDevice = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOSDevice(isIOS);
      return isIOS;
    };

    // Set viewport height
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    const isIOS = checkIOSDevice();
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Small timeout to ensure the browser has updated the viewport
      setTimeout(updateViewportHeight, 100);
    });

    // If iOS, add specific fixes
    if (isIOS) {
      // Prevent scrolling of the body when inputs are focused
      const handleFocus = () => {
        document.body.classList.add('ios-keyboard-open');
      };
      
      const handleBlur = () => {
        document.body.classList.remove('ios-keyboard-open');
      };
      
      const inputElements = document.querySelectorAll('input, textarea');
      inputElements.forEach(el => {
        el.addEventListener('focus', handleFocus);
        el.addEventListener('blur', handleBlur);
      });
      
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        
        inputElements.forEach(el => {
          el.removeEventListener('focus', handleFocus);
          el.removeEventListener('blur', handleBlur);
        });
      };
    }
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // DEBUG LOGGING
  useEffect(() => {
    console.log('[Onboarding] loading:', loading, 'authLoading:', authLoading, 'user:', user, 'guestId:', guestId)
  }, [loading, authLoading, user, guestId])

  // Check for guest profile
  useEffect(() => {
    const storedGuestId = localStorage.getItem('guestProfileId')
    if (storedGuestId) {
      setGuestId(storedGuestId)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    
    // If neither authenticated user nor guest user, redirect to signin
    if (!user && !guestId) {
      console.warn('[Onboarding] No user or guest found, redirecting to /auth/signin')
      router.push('/auth/signin')
      return
    }

    const initializeProfile = async () => {
      try {
        setLoading(true)
        
        // Determine which ID to use (auth user or guest)
        const profileId = user?.id || guestId
        if (!profileId) {
          throw new Error('No profile ID available')
        }
        
        // First check if the profile exists
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle() // Use maybeSingle instead of single to avoid errors when no profile exists
        
        if (error) {
          console.error('Error checking profile:', error)
          throw error
        }
        
        // If no profile exists, create an empty one
        if (!profile) {
          console.log('[Onboarding] No profile found, creating empty profile')
          try {
            // Use the createEmptyProfile from useAuth which handles proper profile creation
            if (user) {
              await createEmptyProfile(user.id)
            } else if (guestId) {
              // For guest profiles, create directly
              await supabase.from('profiles').insert({
                id: guestId,
                username: `guest_${Date.now().toString(36)}`,
                display_name: 'Guest User',
                is_guest: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
            
            // Re-fetch the newly created profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', profileId)
              .single()
            
            if (newProfileError) {
              console.error('Error fetching new profile:', newProfileError)
              throw newProfileError
            }
            
            console.log('[Onboarding] Created new profile:', newProfile)
          } catch (err) {
            console.error('Error creating profile:', err)
            setErrorMessage('Failed to initialize your profile. Please try again or sign out and sign back in.')
          }
        } else {
          console.log('[Onboarding] Found existing profile:', profile)
          // If we have a username already, use it (for guest accounts)
          if (profile.username) {
            setFormData(prevData => ({
              ...prevData,
              username: profile.username || '',
              displayName: profile.display_name || '',
              bio: profile.bio || ''
            }))
          }
        }
      } catch (err) {
        console.error('Error in initializeProfile:', err)
        setErrorMessage('Something went wrong while loading your profile')
      } finally {
        setLoading(false)
      }
    }
    
    initializeProfile()
  }, [authLoading, user, guestId, createEmptyProfile, router])
  
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
      setSubmitting(true)
      setErrorMessage(null)
      
      // Get the right ID (authenticated or guest)
      const profileId = user?.id || guestId
      
      if (!profileId) {
        throw new Error('No profile ID available')
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
      }
      
      console.log('[Onboarding] Submitting profile data:', profileData)
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profileId)
      
      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }
      
      toast.success('Profile updated successfully')
      
      // Re-fetch the profile to ensure we have latest data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError)
        throw fetchError
      }
      
      console.log('[Onboarding] Updated profile:', updatedProfile)
      
      // Redirect to the appropriate page based on account type
      router.push('/directory')
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setErrorMessage('Failed to update your profile. Please try again.')
      toast.error('Something went wrong while updating your profile')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Render the current step
  const renderStep = () => {
    // Show loading state
    if (loading || authLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
        </div>
      )
    }
    
    // Show error message if any
    if (errorMessage) {
      return (
        <div className="text-center p-6 rounded-lg bg-red-500/10 border border-red-500/20">
          <h2 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-white/80 mb-4">{errorMessage}</p>
          <Button 
            onClick={() => router.push('/auth/signin')}
            variant="outline"
            className="bg-white/5 hover:bg-white/10 text-white border-white/20"
          >
            Return to Sign In
          </Button>
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
      className="min-h-screen bg-black text-white ios-safe-area"
      style={{
        minHeight: isIOSDevice ? `calc(var(--vh, 1vh) * 100)` : '100vh',
        height: isIOSDevice ? viewportHeight : 'auto'
      }}
    >
      <div className="flex flex-col min-h-[inherit]">
        <div className="flex-1 max-w-4xl mx-auto px-4 py-8 pt-safe">
          <div className="relative">
            {renderStep()}
          </div>
        </div>

        <div className="sticky bottom-0 bg-black/80 backdrop-blur-lg border-t border-white/10 pb-safe">
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
