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

export default function OnboardingPage() {
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
              
            if (newProfileError) throw newProfileError
            
            // Pre-fill form with the new profile data
            if (newProfile) {
              setFormData({
                username: newProfile.username || `user_${Date.now().toString(36)}`,
                displayName: newProfile.display_name || 'New User',
                bio: newProfile.bio || '',
                preferredGenres: newProfile.preferred_genres || [],
                themeColor: newProfile.theme_color || '#6366f1'
              })
            }
          } catch (createError) {
            console.error('[Onboarding] Error creating empty profile:', createError)
            toast.error('Error creating your profile. Please try again.')
          }
        } else {
          // Pre-fill form if profile exists
          console.log('[Onboarding] Profile found:', profile)
          setFormData({
            username: profile.username || `user_${Date.now().toString(36)}`,
            displayName: profile.display_name || profile.username || 'New User',
            bio: profile.bio || '',
            preferredGenres: profile.preferred_genres || [],
            themeColor: profile.theme_color || '#6366f1'
          })
        }
      } catch (err) {
        console.error('[Onboarding] Error in initializeProfile:', err)
        toast.error('There was an error loading your profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    initializeProfile()
  }, [authLoading, user, guestId, router, createEmptyProfile])

  // FALLBACK UI if stuck loading
  if ((loading || authLoading) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white/80">
          <p>Loading your onboarding experience...</p>
          <p className="text-xs mt-2">(If this persists, check the console for errors)</p>
        </div>
      </div>
    )
  }

  // EXISTING fallback for loading
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Setting up your vibe...</p>
        </m.div>
      </div>
    )
  }

  const paginate = (newDirection: number) => {
    if ((page + newDirection) >= 0 && (page + newDirection) < totalSteps) {
      setPage([page + newDirection, newDirection])
    }
  }

  const handleNext = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(3)
    paginate(1)
  }

  const handleBack = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(3)
    paginate(-1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const profileId = user?.id || guestId
      
      if (!profileId) {
        throw new Error('No profile ID available for update')
      }
      
      console.log('[Onboarding] Submitting profile update:', {
        id: profileId,
        username: formData.username,
        display_name: formData.displayName,
        bio: formData.bio,
        preferred_genres: formData.preferredGenres,
        theme_color: formData.themeColor,
        onboarding_completed: true
      })
      
      // Update the profile with all the onboarding details
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profileId,
          username: formData.username,
          display_name: formData.displayName,
          bio: formData.bio,
          preferred_genres: formData.preferredGenres,
          theme_color: formData.themeColor,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('[Onboarding] Error updating profile:', error)
        throw error
      }
      
      console.log('[Onboarding] Profile updated successfully')
      toast.success('Profile updated successfully!')
      
      // Add a short delay to let the toast show before redirect
      setTimeout(() => {
        // Redirect to the rooms page
        router.push('/rooms')
      }, 500)
    } catch (err) {
      console.error('[Onboarding] Error in handleSubmit:', err)
      toast.error('There was an error updating your profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    const content = [
      // Step 1: Welcome
      <m.div
        key="welcome"
        className="flex flex-col items-center justify-center py-10 text-center space-y-8"
      >
        <div className="space-y-4">
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-20 w-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </m.div>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold">Welcome to Vibe</h1>
            <p className="text-white/70 mt-2">Let's set up your profile in a few simple steps.</p>
          </m.div>
        </div>
        
        <m.div
          className="w-full max-w-md grid grid-cols-1 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start">
              <div className="bg-purple-500/20 p-2 rounded-md mr-4">
                <Mic className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium">Audio Rooms</h3>
                <p className="text-sm text-white/60">Join and create audio conversations on any topic</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start">
              <div className="bg-pink-500/20 p-2 rounded-md mr-4">
                <User className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h3 className="font-medium">Personalized Profile</h3>
                <p className="text-sm text-white/60">Customize your profile and connect with others</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded-md mr-4">
                <Music2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Music & Topics</h3>
                <p className="text-sm text-white/60">Find rooms that match your interests</p>
              </div>
            </div>
          </div>
        </m.div>
      </m.div>,

      // Step 2: Username and Display Name
      <m.div
        key="username"
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-2">Create Your Identity</h2>
          <p className="text-white/70">Choose how you'll appear to others.</p>
        </m.div>

        <m.div 
          className="w-full max-w-md mt-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">@</span>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    // Only allow lowercase alphanumeric and underscore
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, '')
                    setFormData({ ...formData, username: sanitized })
                  }}
                  className="block w-full rounded-md border-0 bg-white/5 px-10 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm"
                  placeholder="username"
                  required
                />
              </div>
              <p className="text-xs text-white/50">Lowercase letters, numbers, and underscores only.</p>
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="display-name" className="block text-sm font-medium text-white">
                Display Name
              </label>
              <input
                type="text"
                id="display-name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="block w-full rounded-md border-0 bg-white/5 px-3.5 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm"
                placeholder="Your Name"
              />
              <p className="text-xs text-white/50">This is how your name will appear to others.</p>
            </div>
          </div>
        </m.div>
      </m.div>,

      // Step 3: Bio and Genres
      <m.div
        key="bio"
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-2">Your Preferences</h2>
          <p className="text-white/70">Tell us about yourself and what you enjoy.</p>
        </m.div>

        <m.div 
          className="w-full max-w-md mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="bio" className="block text-sm font-medium text-white">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="block w-full rounded-md border-0 bg-white/5 px-3.5 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm"
                placeholder="Tell us a bit about yourself..."
              />
              <p className="text-xs text-white/50">What do you want others to know about you?</p>
            </div>

            <div className="space-y-3 text-left">
              <label className="block text-sm font-medium text-white">
                Preferred Music Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      if (window.navigator.vibrate) window.navigator.vibrate(3)
                      setFormData({
                        ...formData, 
                        preferredGenres: formData.preferredGenres.includes(genre)
                          ? formData.preferredGenres.filter(g => g !== genre)
                          : [...formData.preferredGenres, genre]
                      })
                    }}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full transition-colors",
                      formData.preferredGenres.includes(genre)
                        ? "bg-purple-500/80 text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50">Select your favorite genres to discover relevant rooms.</p>
            </div>
          </div>
        </m.div>
      </m.div>,

      // Step 4: Theme Color
      <m.div
        key="theme"
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-white mb-2">Almost There!</h2>
          <p className="text-white/70">Choose your profile theme color.</p>
        </m.div>
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
                "w-12 h-12 rounded-full transition-transform",
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
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
          <div className="relative">
            {renderStep()}
          </div>
        </div>

        <div className="sticky bottom-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              onClick={handleBack}
              disabled={page === 0 || submitting}
              variant="outline"
              className="text-white hover:bg-white/10 border-white/20"
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
                "min-w-[100px] transition-all",
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
