'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Video,
  MonitorSmartphone,
  Zap,
  Plus,
  Key,
  ArrowRight,
  ChevronRight,
  Headphones,
  Users,
  Sparkles,
  MessageSquare,
  Compass
} from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const { user, guestId, isLoading, profile, authLoading, ensureSessionToken } = useAuth();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const features = [
    {
      title: "Real-time Audio",
      description: "Crystal clear audio with ultra-low latency for seamless conversations.",
      icon: <Mic className="w-6 h-6 text-indigo-400" />,
    },
    {
      title: "Live Video Streaming",
      description: "HD video streaming with adaptive quality and multi-participant support.",
      icon: <Video className="w-6 h-6 text-fuchsia-400" />,
    },
    {
      title: "Screen Sharing",
      description: "Share your screen in real-time with high-quality resolution.",
      icon: <MonitorSmartphone className="w-6 h-6 text-sky-400" />,
    },
    {
      title: "Instant Recording",
      description: "Record your sessions with one click and save them in high quality.",
      icon: <Video className="w-6 h-6 text-emerald-400" />,
    },
  ];

  const sections = [
    {
      title: "Join a Room",
      description: "Jump into an existing room and start collaborating instantly.",
      path: "/onboarding",
      icon: <Zap className="w-9 h-9 text-white" />,
      color: "from-indigo-500 via-blue-500 to-sky-500"
    },
    {
      title: "Create Room",
      description: "Start your own room with custom settings and invite others.",
      path: "/onboarding",
      icon: <Plus className="w-9 h-9 text-white" />,
      color: "from-fuchsia-500 via-pink-500 to-purple-500"
    },
    {
      title: "Sign In",
      description: "Access your profile, saved rooms, and connect with your community.",
      path: "/auth",
      icon: <Key className="w-9 h-9 text-white" />,
      color: "from-sky-500 via-cyan-500 to-blue-500"
    }
  ];

  const handleContinue = async (path: string) => {
    try {
      // Apply haptic feedback for tactile response
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }

      // If user is not authenticated and there's no guest ID, create a guest profile first
      if (!user && !guestId) {
        const newGuestId = crypto.randomUUID();
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: newGuestId,
            is_guest: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (createError) throw createError;

        localStorage.setItem('guestProfileId', newGuestId);
        localStorage.setItem('guest_id', newGuestId); // For compatibility
      }

      // Add a small timeout for better visual feedback before navigation
      setTimeout(() => {
        router.push(path);
      }, 50);
    } catch (error) {
      console.error('Error in handleContinue:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Premium animated gradient background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        <motion.div
          className="absolute top-[-25%] left-[-10%] w-[90vw] h-[65vh] rounded-full bg-gradient-to-br from-indigo-700/40 via-blue-700/30 to-fuchsia-700/30 blur-[120px]"
          animate={{ 
            x: [0, 40, 0], 
            y: [0, -30, 0], 
            opacity: [0.45, 0.6, 0.45] 
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "easeInOut",
            type: "tween"
          }}
          style={{ 
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        />
        <motion.div
          className="absolute bottom-[-15%] right-[-7%] w-[65vw] h-[45vh] rounded-full bg-gradient-to-br from-blue-700/30 via-sky-700/20 to-emerald-700/20 blur-[110px]"
          animate={{ 
            x: [0, -30, 0], 
            y: [0, 30, 0], 
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ 
            duration: 13, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 2,
            type: "tween"
          }}
          style={{ 
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        />
        <motion.div
          className="absolute top-[35%] right-[8%] w-[40vw] h-[40vh] rounded-full bg-gradient-to-br from-fuchsia-700/20 via-pink-700/20 to-purple-700/20 blur-[110px]"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, -18, 0], 
            opacity: [0.2, 0.38, 0.2] 
          }}
          transition={{ 
            duration: 19, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 1,
            type: "tween"
          }}
          style={{ 
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        />
        {/* Premium noise overlay */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-60" 
          style={{ 
            backgroundImage: "url('/noise.png')",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }} 
        />
        {/* Gloss effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none"
          style={{ 
            mixBlendMode: "overlay",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        />
      </motion.div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12 md:py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Left column - Hero content */}
          <div className="flex flex-col justify-center gap-10">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 1,
                type: "spring",
                stiffness: 70,
                damping: 20
              }}
              style={{ 
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg mb-6"
            >
              Welcome to <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent animate-gradient-x">Vibe</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 1, 
                delay: 0.2,
                type: "spring",
                stiffness: 70,
                damping: 20
              }}
              style={{ 
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
              className="text-xl md:text-2xl text-zinc-300 max-w-xl mb-8"
            >
              The next generation of immersive audio collaboration. Effortless, beautiful, and fun.
            </motion.p>
            <div className="flex flex-col gap-5">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.7, 
                    delay: 0.3 + i * 0.09,
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                  style={{ 
                    willChange: "transform, opacity",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden"
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-2xl hover:bg-white/[0.07] transition-all duration-300"
                >
                  <div>{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-0.5">{feature.title}</h3>
                    <p className="text-zinc-400 text-base">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right column - Navigation cards */}
          <div className="flex flex-col justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.9, 
                delay: 0.3,
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              style={{ 
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
              className="w-full max-w-md"
            >
              <div className="relative h-[540px] touch-none">
                <AnimatePresence mode="wait">
                  {sections.map((section, index) => (
                    activeSection === index && (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 28, scale: 0.97, rotateX: -10 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, y: -28, scale: 0.97, rotateX: 10 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 120,
                          damping: 20,
                          mass: 0.5
                        }}
                        style={{ 
                          willChange: "transform, opacity",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transformStyle: "preserve-3d",
                          perspective: "1200px"
                        }}
                        className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-[0_8px_40px_0_rgba(30,0,60,0.16)] overflow-hidden flex flex-col justify-between"
                      >
                        {/* Premium gradient bar */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r rounded-t-3xl opacity-80"
                          style={{ 
                            backgroundImage: `linear-gradient(90deg, var(--tw-gradient-stops))`,
                            willChange: "opacity"
                          }}
                        />
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className={`inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${section.color} mb-7 shadow-xl`}>
                              {section.icon}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white drop-shadow-sm">{section.title}</h2>
                            <p className="text-zinc-200 text-base sm:text-lg mb-8">{section.description}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20,
                              mass: 0.5
                            }}
                            onClick={() => handleContinue(section.path)}
                            className={`w-full py-4 rounded-xl text-white text-lg font-semibold shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black transition-all active:scale-[0.98] hover:brightness-110`}
                            style={{ 
                              willChange: "transform",
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              touchAction: "manipulation",
                              background: `linear-gradient(to right, ${section.color.split(' ').map(c => `var(--${c.split('-')[1]})`).join(', ')})`,
                              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
                            }}
                          >
                            Continue
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </motion.button>
                        </div>
                        <div className="absolute bottom-8 right-8 flex space-x-2">
                          {sections.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveSection(i)}
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                i === index 
                                  ? 'bg-white scale-125 shadow-lg' 
                                  : 'bg-white/30 hover:bg-white/50'
                              }`}
                              style={{ touchAction: "manipulation" }}
                              aria-label={`Go to slide ${i + 1}`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
