'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-supabase-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Music2, User, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const supabase = createClientComponentClient()

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    preferredGenres: [] as string[],
    themeColor: '#6366f1'
  })
  const totalSteps = 4
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If no authenticated user, redirect to sign in
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    const initializeProfile = async () => {
      try {
        setLoading(true)
        const profileId = user.id

        if (!profileId) {
          throw new Error('No profile ID found')
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single()

        if (error || !profile) {
          console.error('Error loading profile:', error)
          toast.error('Error loading profile')
          // Stop loading and show UI instead of redirecting
          setLoading(false)
          return
        }

        // Initialize form data from profile
        setFormData(prev => ({
          ...prev,
          username: profile.username || '',
          displayName: profile.display_name || '',
          bio: profile.bio || '',
          preferredGenres: profile.preferred_genres || [],
          themeColor: profile.theme_color || '#6366f1'
        }))

        setLoading(false)
      } catch (error) {
        console.error('Error in initializeProfile:', error)
        toast.error('Error initializing profile')
        router.push('/')
        setLoading(false)
      }
    }

    initializeProfile()
  }, [user, authLoading, router])

  const handleNext = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(3)
    if (step < totalSteps - 1) {
      setDirection('forward')
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(3)
    if (step > 0) {
      setDirection('back')
      setStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const profileId = user.id

      if (!profileId) {
        throw new Error('No profile ID found')
      }

      // Prepare base update payload
      const baseUpdate = {
        username: formData.username,
        display_name: formData.displayName,
        bio: formData.bio,
        preferred_genres: formData.preferredGenres,
        theme_color: formData.themeColor,
        updated_at: new Date().toISOString()
      }

      // Try update with onboarding flag first
      const { error: flagError } = await supabase
        .from('profiles')
        .update({ ...baseUpdate, onboarding_completed: true })
        .eq('id', profileId)

      // If onboarding column doesn't exist, update without it
      if (flagError?.code === 'PGRST204') {
        const { error: baseError } = await supabase
          .from('profiles')
          .update(baseUpdate)
          .eq('id', profileId)
        if (baseError) throw baseError
      } else if (flagError) {
        throw flagError
      }

      // Success haptics and feedback
      if (window.navigator.vibrate) window.navigator.vibrate([3, 30, 3])
      toast.success('Profile updated successfully')
      
      // Mark onboarding as done locally
      localStorage.setItem('onboardingCompleted', 'true')
      
      router.push('/rooms')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-6">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Mic className="w-12 h-12 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to Vibe
                </h2>
                <p className="text-white/70 text-lg mt-3 max-w-sm mx-auto leading-relaxed">
                  Let's set up your profile and get you ready to join the conversation.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )
      case 1:
        return (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-6">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <User className="w-12 h-12 text-white" />
              </motion.div>
              <div className="space-y-6 max-w-md mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-2">Create Your Identity</h2>
                  <p className="text-white/70">Choose how others will know you.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="absolute -bottom-6 left-0 text-white/40 text-sm">
                      This will be your unique identifier
                    </p>
                  </div>
                  <div className="relative mt-8">
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="absolute -bottom-6 left-0 text-white/40 text-sm">
                      This is how your name will appear to others
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-6">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Music2 className="w-12 h-12 text-white" />
              </motion.div>
              <div className="space-y-6 max-w-md mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-2">Your Music Taste</h2>
                  <p className="text-white/70">Select your favorite genres to find like-minded listeners.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-3 mt-6"
                >
                  {[
                    'Hip Hop', 'Pop', 'Rock', 'R&B',
                    'Electronic', 'Jazz', 'Classical', 'Metal',
                    'Folk', 'Country', 'Latin', 'Indie'
                  ].map((genre) => (
                    <button
                      key={genre}
                      onClick={() => {
                        if (window.navigator.vibrate) window.navigator.vibrate(2)
                        setFormData(prev => ({
                          ...prev,
                          preferredGenres: prev.preferredGenres.includes(genre)
                            ? prev.preferredGenres.filter(g => g !== genre)
                            : [...prev.preferredGenres, genre]
                        }))
                      }}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        formData.preferredGenres.includes(genre)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-6">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <div className="space-y-6 max-w-md mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-2">Almost Ready!</h2>
                  <p className="text-white/70">Here's how your profile will look.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/10 rounded-xl p-6 text-left mt-6"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                      {formData.displayName?.charAt(0) || formData.username?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{formData.displayName || formData.username}</h3>
                      <p className="text-white/70">@{formData.username}</p>
                    </div>
                  </div>
                  {formData.preferredGenres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {formData.preferredGenres.map(genre => (
                        <span 
                          key={genre}
                          className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/90"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )
      default:
        return null
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-r-purple-500 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <motion.p 
            className="text-lg font-medium text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Setting up your Vibe...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction === 'forward' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'forward' ? -20 : 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="fixed z-50 bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mx-4 flex items-center justify-between">
            <Button
              onClick={handleBack}
              disabled={step === 0}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === step ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                  initial={false}
                  animate={{
                    scale: i === step ? 1.2 : 1,
                    opacity: i === step ? 1 : 0.5
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              ))}
            </div>

            <Button
              onClick={step === totalSteps - 1 ? handleSubmit : handleNext}
              disabled={loading || (step === 1 && !formData.username)}
              className={`${
                step === totalSteps - 1
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              } text-white min-w-[100px] transition-all`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === totalSteps - 1 ? (
                'Finish'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
