'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Video,
  MonitorSmartphone,
  Zap,
  Plus,
  Key,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

const ROUTES = {
  ONBOARDING: '/onboarding' as const,
  LOGIN: '/auth/login' as const,
} as const;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, guestId, isLoading } = useAuth();

  // Debug logs
  console.log('Home page render:', { mounted, isLoading, user, guestId });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Show loading state only while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render until mounted (client-side)
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
      path: ROUTES.ONBOARDING,
      icon: <Zap className="w-9 h-9 text-white" />,
      color: "from-indigo-500 via-blue-500 to-sky-500"
    },
    {
      title: "Create Room",
      description: "Start your own room with custom settings and invite others.",
      path: ROUTES.ONBOARDING,
      icon: <Plus className="w-9 h-9 text-white" />,
      color: "from-fuchsia-500 via-pink-500 to-purple-500"
    },
    {
      title: "Sign In",
      description: "Access your profile, saved rooms, and connect with your community.",
      path: ROUTES.LOGIN,
      icon: <Key className="w-9 h-9 text-white" />,
      color: "from-sky-500 via-cyan-500 to-blue-500"
    }
  ];

  const handleContinue = async (path: typeof ROUTES[keyof typeof ROUTES]) => {
    try {
      console.log('handleContinue:', { path, user, guestId });

      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }

      // If user is authenticated, ensure session token
      if (user) {
        await supabase.auth.getSession();
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
      console.log('Creating new guest profile:', newGuestId);

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
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-black pointer-events-none" />
          
          {/* Main content */}
          <div className="relative w-full max-w-xl mx-auto">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-2xl"
              >
                <Headphones className="w-8 h-8 text-white" />
              </m.div>
              <m.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl sm:text-5xl font-bold text-white mb-4"
              >
                Welcome to Vibe
              </m.h1>
              <m.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg sm:text-xl text-zinc-400"
              >
                Next generation audio collaboration
              </m.p>
            </div>

            {/* Feature cards */}
            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-12"
            >
              {features.map((feature, index) => (
                <m.div
                  key={feature.title}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </m.div>
              ))}
            </m.div>

            {/* Action cards */}
            <div className="relative h-[400px] sm:h-[450px]">
              <AnimatePresence mode="wait">
                {sections.map((section, index) => (
                  index === activeSection && (
                    <m.div
                      key={section.title}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5 }}
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
                          
                          <m.button
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
                          </m.button>
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
                    </m.div>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
