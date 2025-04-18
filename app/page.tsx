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
import { toast } from 'sonner';

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
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }

      // If user is authenticated, ensure session token
      if (user) {
        await ensureSessionToken();
        router.push(path);
        return;
      }

      // If guest ID exists, use it
      if (guestId) {
        router.push(path);
        return;
      }

      // Create new guest profile if neither user nor guestId exists
      const newGuestId = crypto.randomUUID();
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: newGuestId,
          is_guest: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating guest profile:', createError);
        toast.error('Failed to create guest profile. Please try again.');
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([10, 5, 10]);
        }
        return;
      }

      localStorage.setItem('guestProfileId', newGuestId);
      localStorage.setItem('guest_id', newGuestId);
      toast.success('Guest profile created successfully');
      router.push(path);

    } catch (error) {
      console.error('Error in handleContinue:', error);
      toast.error('Something went wrong. Please try again.');
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([10, 5, 10]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Premium animated gradient background */}
      <motion.div
        className="absolute inset-0 z-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(0,0,0,0))]"
          style={{
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        />
      </motion.div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div 
          className="w-full max-w-5xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2 
          }}
        >
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400">
            Welcome to Vibe
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-400 max-w-2xl mx-auto">
            Next generation audio collaboration
          </p>
        </motion.div>

        {/* Features grid with staggered animation */}
        <motion.div 
          className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 px-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                  }
                }
              }}
              className="flex items-start p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
              style={{
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <div className="flex-shrink-0 mr-4">{feature.icon}</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action cards */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9]">
            <AnimatePresence mode="wait">
              {sections.map((section, index) => (
                activeSection === index && (
                  <motion.div
                    key={section.title}
                    initial={{ 
                      opacity: 0,
                      scale: 0.95,
                      rotateX: 5,
                      y: 20
                    }}
                    animate={{ 
                      opacity: 1,
                      scale: 1,
                      rotateX: 0,
                      y: 0
                    }}
                    exit={{ 
                      opacity: 0,
                      scale: 0.95,
                      rotateX: -5,
                      y: -20
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8
                    }}
                    className="absolute inset-0 p-4"
                    style={{
                      willChange: "transform, opacity",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transformStyle: "preserve-3d",
                      perspective: "1200px"
                    }}
                  >
                    <div 
                      className="h-full bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_8px_40px_0_rgba(0,0,0,0.3)] overflow-hidden"
                      style={{
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      {/* Premium gradient bar */}
                      <div 
                        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${section.color} rounded-t-3xl opacity-80`}
                        style={{ willChange: "opacity" }}
                      />
                      
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className={`inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${section.color} mb-7 shadow-2xl`}>
                            {section.icon}
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">{section.title}</h2>
                          <p className="text-zinc-300 text-base sm:text-lg mb-8">{section.description}</p>
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
                          className={`w-full py-4 rounded-xl text-white text-lg font-semibold shadow-2xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black transition-all bg-gradient-to-r ${section.color}`}
                          style={{ 
                            willChange: "transform",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            touchAction: "manipulation",
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
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
