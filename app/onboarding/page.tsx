'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-supabase-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { m as motion, AnimatePresence } from 'framer-motion'
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
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const initializeProfile = async () => {
      try {
        setLoading(true)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        // Pre-fill form if profile exists
        if (profile) {
          setFormData({
            username: profile.username || '',
            displayName: profile.display_name || '',
            bio: profile.bio || '',
            preferredGenres: profile.preferred_genres || [],
            themeColor: profile.theme_color || '#6366f1'
          })
        }
      } catch (error: any) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    initializeProfile()
  }, [user, authLoading, router])

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
    if (!user?.id) {
      toast.error('No user ID found')
      return
    }

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          display_name: formData.displayName,
          bio: formData.bio,
          preferred_genres: formData.preferredGenres,
          theme_color: formData.themeColor,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      if (window.navigator.vibrate) window.navigator.vibrate([3, 30, 3])
      toast.success('Profile updated successfully')
      localStorage.setItem('onboardingCompleted', 'true')
      router.push('/rooms')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Error updating profile')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    const content = [
      // Welcome Step
      <motion.div 
        key="welcome"
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
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
      </motion.div>,

      // Identity Step
      <motion.div 
        key="identity"
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
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
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative mb-8">
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="absolute top-full mt-2 text-white/60 text-sm">
                  This will be your unique identifier
                </p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Display Name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="absolute top-full mt-2 text-white/60 text-sm">
                  This is how your name will appear to others
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>,

      // Genres Step
      <motion.div 
        key="genres"
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="text-center space-y-6">
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Music2 className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">Pick Your Vibes</h2>
            <p className="text-white/70">Select the genres you're into.</p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {genreOptions.map((genre) => (
              <motion.button
                key={genre}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const newGenres = formData.preferredGenres.includes(genre)
                    ? formData.preferredGenres.filter(g => g !== genre)
                    : [...formData.preferredGenres, genre]
                  setFormData({ ...formData, preferredGenres: newGenres })
                  if (window.navigator.vibrate) window.navigator.vibrate(3)
                }}
                className={cn(
                  "p-3 rounded-lg text-sm font-medium transition-all",
                  formData.preferredGenres.includes(genre)
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                {genre}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>,

      // Final Step
      <motion.div 
        key="final"
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="text-center space-y-6">
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">Almost There!</h2>
            <p className="text-white/70">Choose your profile theme color.</p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-4 gap-3 max-w-xs mx-auto mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {themeColors.map((color) => (
              <motion.button
                key={color}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setFormData({ ...formData, themeColor: color })
                  if (window.navigator.vibrate) window.navigator.vibrate(3)
                }}
                className={cn(
                  "w-12 h-12 rounded-full transition-transform",
                  formData.themeColor === color && "ring-2 ring-white ring-offset-2 ring-offset-black"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    ]

    return (
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
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
        </motion.div>
      </AnimatePresence>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Setting up your vibe...</p>
        </motion.div>
      </div>
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
                <motion.div
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
