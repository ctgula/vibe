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
            
            // Pre-fill form with data from profile
            if (newProfile) {
              setFormData({
                ...formData,
                username: newProfile.username || '',
                displayName: newProfile.display_name || '',
                bio: newProfile.bio || '',
                preferredGenres: newProfile.preferred_genres || [],
                themeColor: newProfile.theme_color || '#6366f1'
              })
            }
          } catch (error) {
            console.error('Error creating empty profile:', error)
            setErrorMessage('Failed to create a profile. Please try again.')
            throw error
          }
        } else {
          // Pre-fill form with data from profile
          console.log('[Onboarding] Profile found, pre-filling form:', profile)
          setFormData({
            ...formData,
            username: profile.username || '',
            displayName: profile.display_name || '',
            bio: profile.bio || '',
            preferredGenres: profile.preferred_genres || [],
            themeColor: profile.theme_color || '#6366f1'
          })

          // If onboarding has already been completed, redirect to room page
          if (profile.onboarding_completed) {
            console.log('[Onboarding] Onboarding already completed, redirecting to /rooms')
            router.push('/rooms')
            return
          }
        }
      } catch (err) {
        console.error('[Onboarding] Error in initializeProfile:', err)
        setErrorMessage('Failed to load your profile. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    initializeProfile()
  }, [authLoading, user, guestId, router, createEmptyProfile, formData])

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
    } catch (err: any) {
      console.error('[Onboarding] Error in handleSubmit:', err)
      setErrorMessage(err.message || 'There was an error updating your profile. Please try again.')
      toast.error(err.message || 'There was an error updating your profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Render the current step
  const renderStep = () => {
    // If still loading or checking auth
    if (loading || authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <h3 className="text-xl font-medium text-white">Setting up your profile...</h3>
          <p className="text-zinc-400 mt-2">Just a moment while we get things ready.</p>
        </div>
      )
    }

    // If we have an error
    if (errorMessage) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 mb-6 max-w-md">
            <h3 className="text-xl font-medium text-red-400 mb-2">Oops, something went wrong</h3>
            <p className="text-zinc-300">{errorMessage}</p>
          </div>
          
          <Button 
            onClick={() => router.push('/')}
            className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Return to Home
          </Button>
        </div>
      )
    }

    const content = [
      // Step 1: Username
      <m.div key="step1" className="text-center px-4">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <User className="w-16 h-16 mx-auto mb-6 text-purple-500" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            Let's create your profile
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-12">
            First, choose a unique username. This will be your identity in the app.
          </p>
        </m.div>
        
        <div className="max-w-md mx-auto">
          <div className="relative">
            <m.label 
              htmlFor="username"
              className="block text-sm font-medium text-zinc-400 mb-2 text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Username
            </m.label>
            
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="block w-full pl-10 rounded-md border-0 bg-zinc-800/70 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-purple-500"
                placeholder="cooluser42"
                required
                disabled={submitting}
              />
            </m.div>
            
            <m.p 
              className="mt-2 text-sm text-zinc-500 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              This is how other users will find you.
            </m.p>
          </div>
        </div>
      </m.div>,
      
      // Step 2: Display Name & Bio
      <m.div key="step2" className="text-center px-4">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-16 h-16 mx-auto mb-6 text-purple-500" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            Tell us about yourself
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-8">
            Add a display name and short bio to help people get to know you.
          </p>
        </m.div>
        
        <div className="max-w-md mx-auto space-y-6">
          <m.div 
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="displayName" className="block text-sm font-medium text-zinc-400 mb-2 text-left">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="block w-full rounded-md border-0 bg-zinc-800/70 py-2.5 px-4 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-purple-500"
              placeholder="Your display name"
              disabled={submitting}
            />
            <p className="mt-2 text-sm text-zinc-500 text-left">
              This name will be displayed to others in rooms.
            </p>
          </m.div>
          
          <m.div 
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-400 mb-2 text-left">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="block w-full rounded-md border-0 bg-zinc-800/70 py-2.5 px-4 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-purple-500 min-h-[100px]"
              placeholder="Tell us a bit about yourself..."
              disabled={submitting}
              maxLength={160}
            />
            <p className="mt-2 text-sm text-zinc-500 text-left">
              {160 - (formData.bio?.length || 0)} characters remaining
            </p>
          </m.div>
        </div>
      </m.div>,
      
      // Step 3: Music Genres
      <m.div key="step3" className="text-center px-4">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Music2 className="w-16 h-16 mx-auto mb-6 text-purple-500" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            What music do you like?
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-8">
            Select your favorite genres to help you discover rooms you'll enjoy.
          </p>
        </m.div>
        
        <m.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {genreOptions.map((genre) => (
              <m.button
                key={genre}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (formData.preferredGenres.includes(genre)) {
                    setFormData({
                      ...formData,
                      preferredGenres: formData.preferredGenres.filter(g => g !== genre)
                    })
                  } else {
                    setFormData({
                      ...formData,
                      preferredGenres: [...formData.preferredGenres, genre]
                    })
                  }
                  if (window.navigator.vibrate) window.navigator.vibrate(3)
                }}
                className={cn(
                  "px-4 py-3 rounded-lg border transition-all",
                  formData.preferredGenres.includes(genre)
                    ? "bg-purple-500/20 border-purple-500/50 text-white"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
                disabled={submitting}
              >
                {genre}
              </m.button>
            ))}
          </div>
          <p className="text-sm text-zinc-500">
            {formData.preferredGenres.length === 0 
              ? "Select at least one genre that interests you"
              : `${formData.preferredGenres.length} genre${formData.preferredGenres.length !== 1 ? 's' : ''} selected`
            }
          </p>
        </m.div>
      </m.div>,
      
      // Step 4: Theme Color
      <m.div key="step4" className="text-center px-4">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Mic className="w-16 h-16 mx-auto mb-6 text-purple-500" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            Pick your theme color
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-8">
            Choose a color to personalize your profile. This will appear in rooms you create.
          </p>
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
