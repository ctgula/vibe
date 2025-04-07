"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Music, Video, Headphones } from "lucide-react";
import { toast } from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-red-400 mb-4">{error.message || "Unknown error"}</p>
      <Button onClick={resetErrorBoundary} variant="default">
        Try again
      </Button>
    </div>
  );
}

function WelcomePageContent() {
  const [isClient, setIsClient] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const router = useRouter();
  
  // Access auth context directly - will throw error if not available
  const { user, authLoading, createGuestSession, isAuthenticated } = useAuth();

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isClient && isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isClient, isAuthenticated, authLoading, router]);

  // Feature rotation
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isClient]);

  const handleGuestAccess = async () => {
    try {
      toast.loading('Creating guest session...', { id: 'guest-login' });
      
      const guestId = await createGuestSession();
      
      if (guestId) {
        // Add haptic feedback if available
        if (isClient && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([3, 30, 3]);
        }
        
        toast.success('Welcome! You can now explore rooms as a guest.', { id: 'guest-login' });
        
        // Redirect to home page
        router.push('/');
      } else {
        toast.error('Failed to create guest session. Please try again.', { id: 'guest-login' });
      }
    } catch (error) {
      console.error('Error creating guest session:', error);
      toast.error('Something went wrong. Please try again.', { id: 'guest-login' });
    }
  };

  const features = [
    {
      icon: <Users className="h-8 w-8 text-indigo-400" />,
      title: "Join Live Conversations",
      description: "Connect with people in real-time audio rooms about topics you care about"
    },
    {
      icon: <Music className="h-8 w-8 text-purple-400" />,
      title: "Spatial Audio",
      description: "Experience immersive conversations with our spatial audio technology"
    },
    {
      icon: <Video className="h-8 w-8 text-pink-400" />,
      title: "Video Rooms",
      description: "Turn on your camera when you want a more personal connection"
    },
    {
      icon: <Headphones className="h-8 w-8 text-blue-400" />,
      title: "Listen Anywhere",
      description: "Join rooms from any device, even in the background while using other apps"
    }
  ];

  // Show loading state while client-side rendering is happening or auth is loading
  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black" data-testid="welcome-loading">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden" data-testid="welcome-content">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20"></div>
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-3/4 h-1/2 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Animated particles - Only render on client */}
      {isClient && (
        <div className="fixed inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.3
              }}
              animate={{
                y: [null, Math.random() * -100 - 50],
                opacity: [null, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col min-h-screen">
        <header className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="relative w-10 h-10 mr-2">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg"></div>
              <div className="absolute inset-[2px] bg-black rounded-[6px] flex items-center justify-center text-white font-bold text-xl">V</div>
            </div>
            <h1 className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">VIBE</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 py-8 md:py-12">
          {/* Left side - Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Connect through{" "}
              <span className="relative">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  live audio
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-full z-0"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                ></motion.span>
              </span>{" "}
              rooms with spatial sound
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Join live conversations, meet new people, and share ideas in immersive audio spaces.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGuestAccess}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-full font-medium text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all duration-300"
                data-testid="guest-access-button"
              >
                <Sparkles className="h-5 w-5" />
                Continue as Guest
              </Button>
              
              <Link href="/auth/login" className="inline-block">
                <Button 
                  variant="outline" 
                  className="border-gray-700 hover:border-indigo-500 text-gray-300 hover:text-white px-6 py-3 rounded-full font-medium text-lg flex items-center justify-center gap-2 transition-all duration-300"
                >
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Right side - Feature showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="bg-gray-800/50 p-4 rounded-full mb-4">
                      {features[currentFeature].icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">
                      {features[currentFeature].title}
                    </h3>
                    <p className="text-gray-400">
                      {features[currentFeature].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex justify-center mt-6 gap-1">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature
                          ? "bg-indigo-500 w-4"
                          : "bg-gray-700"
                      }`}
                      onClick={() => setCurrentFeature(index)}
                      aria-label={`View feature ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
        
        <footer className="py-6 text-center text-gray-500 text-sm">
          <p> 2025 Vibe. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <WelcomePageContent />
    </ErrorBoundary>
  );
}
