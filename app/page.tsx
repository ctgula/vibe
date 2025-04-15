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
  const { user, guestId, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Auto-rotate sections every 5 seconds
    const interval = setInterval(() => {
      setActiveSection(prev => (prev + 1) % 3);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const features = [
    {
      icon: <Headphones className="w-6 h-6 text-indigo-400" />,
      title: "Spatial Audio Rooms",
      description: "Experience conversations in 3D space with realistic audio positioning"
    },
    {
      icon: <Users className="w-6 h-6 text-sky-400" />,
      title: "Live Collaboration",
      description: "Connect with others in real-time audio rooms for discussions and collaboration"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      title: "Immersive Experience",
      description: "Join themed rooms with custom audio environments and effects"
    }
  ];

  const sections = [
    {
      title: "Browse Rooms",
      description: "Discover active conversations and join the discussion",
      icon: <Compass className="w-8 h-8" />,
      color: "from-indigo-500 to-blue-600",
      path: "/directory"
    },
    {
      title: "Create Room",
      description: "Start your own audio room and invite others",
      icon: <MessageSquare className="w-8 h-8" />,
      color: "from-sky-500 to-cyan-600",
      path: "/rooms/create"
    },
    {
      title: "Complete Setup",
      description: "Customize your profile and preferences",
      icon: <Zap className="w-8 h-8" />,
      color: "from-pink-500 to-purple-600",
      path: "/onboarding"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px]"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[40%] rounded-full bg-blue-900/20 blur-[100px]"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, 30, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]"
          animate={{ 
            x: [0, -15, 0], 
            y: [0, -25, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left column - Hero content */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400">
                Welcome to Vibe
              </h1>
              <p className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-xl">
                Connect through immersive audio rooms with spatial sound and real-time collaboration.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/directory')}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 rounded-xl text-white font-semibold text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center group"
                >
                  Browse Rooms
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/onboarding')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 rounded-xl text-white font-semibold text-lg flex items-center justify-center"
                >
                  Get Started
                  <ChevronRight className="ml-1 w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Features list */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
                    className="flex items-start gap-4"
                  >
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="text-zinc-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Right column - Navigation cards */}
          <div className="flex flex-col justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="relative h-[500px]">
                <AnimatePresence mode="wait">
                  {sections.map((section, index) => (
                    activeSection === index && (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 20, rotateY: -10 }}
                        animate={{ opacity: 1, y: 0, rotateY: 0 }}
                        exit={{ opacity: 0, y: -20, rotateY: 10 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-br bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden"
                        style={{ 
                          transformStyle: "preserve-3d",
                          perspective: "1000px"
                        }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r rounded-t-3xl opacity-70"
                          style={{ backgroundImage: `linear-gradient(to right, ${section.color.split(' ')[0].replace('from-', '')}, ${section.color.split(' ')[1].replace('to-', '')})` }}
                        ></div>
                        
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className={`inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br ${section.color} mb-6 shadow-lg`}>
                              {section.icon}
                            </div>
                            <h2 className="text-3xl font-bold mb-3">{section.title}</h2>
                            <p className="text-zinc-300 text-lg mb-8">{section.description}</p>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(section.path)}
                            className={`w-full py-4 rounded-xl bg-gradient-to-r ${section.color} text-white text-lg font-semibold shadow-lg flex items-center justify-center`}
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
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-white scale-125' : 'bg-white/30'}`}
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
