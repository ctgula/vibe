'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Callback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('Finishing sign-in...')

  useEffect(() => {
    const getSession = async () => {
      try {
        // First, check if there's a code in the URL to exchange
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorDesc = params.get('error_description')
        
        if (errorDesc) {
          setError(errorDesc)
          return
        }
        
        if (code) {
          console.log('Found auth code, exchanging for session...')
          setMessage('Processing your sign-in...')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError)
            setError(exchangeError.message)
            return
          }
        }
        
        // Check if we already have a session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setError(sessionError.message)
          return
        }

        if (data?.session) {
          // User is logged in, redirect them
          console.log('Session found, redirecting')
          setMessage('Sign-in successful! Redirecting...')
          
          // Check if there's a redirect path stored in sessionStorage
          const redirectPath = sessionStorage.getItem('redirectAfterAuth')
          
          // Set flag for successful login
          sessionStorage.setItem('justLoggedIn', 'true')
          
          // Clear any login-related flags
          sessionStorage.removeItem('redirectedToLogin')
          sessionStorage.removeItem('loggingIn')
          
          // Redirect to the stored path or default to home
          if (redirectPath) {
            sessionStorage.removeItem('redirectAfterAuth')
            router.push(redirectPath)
          } else {
            router.push('/')
          }
        } else {
          // Wait for session to be set via URL fragment
          setMessage('Waiting for authentication...')
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              console.log('Auth state changed to SIGNED_IN, redirecting')
              setMessage('Sign-in successful! Redirecting...')
              
              // Set flag for successful login
              sessionStorage.setItem('justLoggedIn', 'true')
              
              // Clear any login-related flags
              sessionStorage.removeItem('redirectedToLogin')
              sessionStorage.removeItem('loggingIn')
              
              // Check if there's a redirect path stored in sessionStorage
              const redirectPath = sessionStorage.getItem('redirectAfterAuth')
              
              // Redirect to the stored path or default to home
              if (redirectPath) {
                sessionStorage.removeItem('redirectAfterAuth')
                router.push(redirectPath)
              } else {
                router.push('/')
              }
            }
          })
          
          // Set a timeout to handle cases where auth state change doesn't fire
          const timeout = setTimeout(() => {
            setMessage('Taking longer than expected...')
            
            // After 10 seconds, offer a manual redirect option
            setTimeout(() => {
              setMessage('Authentication may have completed silently.')
              setError('You can try continuing to the app manually.')
            }, 5000)
          }, 5000)
          
          // Clean up subscription and timeout
          return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
          }
        }
      } catch (err: any) {
        console.error('Unexpected error in auth callback:', err)
        setError(err.message || 'An unexpected error occurred')
      }
    }

    getSession()
  }, [router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white p-4">
        <div className="flex flex-col items-center space-y-4 p-6 bg-red-900/20 border border-red-700/50 rounded-lg shadow-lg text-center max-w-md w-full backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">Authentication Issue</h2>
          <p className="text-red-300">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
            <button 
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors flex-1"
            >
              Return to Login
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors flex-1"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex flex-col items-center space-y-4 p-8 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md max-w-md w-full"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
        <p className="text-lg text-white">{message}</p>
        <p className="text-sm text-white/60">You'll be redirected automatically.</p>
        
        {message.includes('longer') && (
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Continue to App
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
