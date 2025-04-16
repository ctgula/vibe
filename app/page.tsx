'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Headphones, 
  Users, 
  Sparkles, 
  MessageSquare, 
  Compass, 
  ChevronRight, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  let user, guestId, isLoading;
  try {
    ({ user, guestId, isLoading } = useAuth());
  } catch {
    // If useAuth throws (e.g. not in AuthProvider), render nothing until mounted
    user = guestId = null;
    isLoading = true;
  }
  const router = useRouter();

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
      icon: <Headphones className="w-7 h-7 text-indigo-400 drop-shadow-glow" />, // subtle glow
      title: "Spatial Audio Rooms",
      description: "Experience conversations in 3D space with realistic audio positioning"
    },
    {
      icon: <Users className="w-7 h-7 text-sky-400 drop-shadow-glow" />,
      title: "Live Collaboration",
      description: "Connect with others in real-time audio rooms for discussions and collaboration"
    },
    {
      icon: <Sparkles className="w-7 h-7 text-pink-400 drop-shadow-glow" />,
      title: "Immersive Experience",
      description: "Join themed rooms with custom audio environments and effects"
    }
  ];

  const sections = [
    {
      title: "Browse Rooms",
      description: "Discover active conversations and join the discussion",
      icon: <Compass className="w-9 h-9" />,
      color: "from-indigo-500 via-blue-500 to-sky-400",
      path: "/directory"
    },
    {
      title: "Create Room",
      description: "Start your own audio room and invite others",
      icon: <MessageSquare className="w-9 h-9" />,
      color: "from-emerald-500 via-cyan-500 to-blue-400",
      path: "/rooms/create"
    },
    {
      title: "Complete Setup",
      description: "Customize your profile and preferences",
      icon: <Zap className="w-9 h-9" />,
      color: "from-pink-500 via-fuchsia-500 to-purple-500",
      path: "/onboarding"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Apple-level animated gradient background with noise and gloss overlays */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-[-25%] left-[-10%] w-[90vw] h-[65vh] rounded-full bg-gradient-to-br from-indigo-700/40 via-blue-700/30 to-fuchsia-700/30 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0], opacity: [0.45, 0.6, 0.45] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-15%] right-[-7%] w-[65vw] h-[45vh] rounded-full bg-gradient-to-br from-blue-700/30 via-sky-700/20 to-emerald-700/20 blur-[110px]"
          animate={{ x: [0, -30, 0], y: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-[35%] right-[8%] w-[40vw] h-[40vh] rounded-full bg-gradient-to-br from-fuchsia-700/20 via-pink-700/20 to-purple-700/20 blur-[110px]"
          animate={{ x: [0, -20, 0], y: [0, -18, 0], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Subtle noise overlay for depth */}
        <div className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-60" style={{ backgroundImage: "url('/noise.png')" }} />
        {/* Gloss overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Left column - Hero content */}
          <div className="flex flex-col justify-center gap-10">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg mb-6"
              style={{ letterSpacing: '-0.03em' }}
            >
              Welcome to <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent animate-gradient-x">Vibe</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
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
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.09 }}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-2xl transition-all"
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
              transition={{ duration: 0.9, delay: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="relative h-[540px]">
                <AnimatePresence mode="wait">
                  {sections.map((section, index) => (
                    activeSection === index && (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 28, scale: 0.97, rotateY: -7 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, y: -28, scale: 0.97, rotateY: 7 }}
                        transition={{ duration: 0.55, type: 'spring', stiffness: 180 }}
                        className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 shadow-[0_8px_40px_0_rgba(30,0,60,0.16)] overflow-hidden flex flex-col justify-between"
                        style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r rounded-t-3xl opacity-80"
                          style={{ backgroundImage: `linear-gradient(90deg, var(--tw-gradient-stops))` }}
                        ></div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className={`inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${section.color} mb-7 shadow-xl`}>{section.icon}</div>
                            <h2 className="text-3xl font-bold mb-3 text-white drop-shadow-sm">{section.title}</h2>
                            <p className="text-zinc-200 text-lg mb-8">{section.description}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.04, boxShadow: "0 0 0 5px rgba(99,102,241,0.12)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(section.path)}
                            className={`w-full py-4 rounded-xl bg-gradient-to-r ${section.color} text-white text-lg font-semibold shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all`}
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
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-white scale-125 shadow-lg' : 'bg-white/30'}`}
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
