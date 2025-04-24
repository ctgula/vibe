'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import dynamic from 'next/dynamic';
import { 
  Headphones,
  ArrowRight,
  Mic,
  Video,
  Compass,
  Users,
  MessageSquare,
  Music,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Head from 'next/head';

const ROUTES = {
  ONBOARDING: '/onboarding' as const,
  LOGIN: '/auth/signin' as const,
  SIGN_UP: '/auth/signup' as const,
  ROOMS: '/rooms' as const,
} as const;

// Memo-ized components for performance
const Logo = memo(() => (
  <div className="flex items-center">
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg shadow-lg mr-3">
      <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
    </div>
    <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">vibe</span>
  </div>
));
Logo.displayName = 'Logo';

const FeatureCard = memo(({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="backdrop-blur-sm bg-white/[0.03] rounded-xl p-4 sm:p-6 border border-white/10 hover:border-purple-500/20 transition-all shadow-lg group">
    <div className="flex items-center mb-3 sm:mb-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-purple-900/10 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h2 className="text-base sm:text-lg font-bold">{title}</h2>
    </div>
    <p className="text-sm text-gray-400">
      {description}
    </p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

const RoomTypeTag = memo(({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
    <span className="text-purple-400">{icon}</span>
    <span className="text-sm sm:text-base font-medium">{label}</span>
  </div>
));
RoomTypeTag.displayName = 'RoomTypeTag';

const ActionButton = memo(({ 
  onClick, 
  children, 
  primary = false,
  className = "",
  type = "button",
  ariaLabel
}: { 
  onClick: () => void, 
  children: React.ReactNode, 
  primary?: boolean,
  className?: string,
  type?: "button" | "submit",
  ariaLabel?: string
}) => (
  <button
    onClick={onClick}
    type={type}
    aria-label={ariaLabel}
    className={`w-full py-2.5 sm:py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all ${
      primary 
        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-purple-900/20 hover:translate-y-[-1px]" 
        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
    } ${className}`}
  >
    {children}
  </button>
));
ActionButton.displayName = 'ActionButton';

// For performance, load secondary content only after initial render
const SecondaryContent = dynamic(() => Promise.resolve(({ onContinue }: { onContinue: (path: string) => void }) => (
  <>
    {/* Feature Cards */}
    <div className="mt-12 sm:mt-16">
      <h2 className="text-lg sm:text-2xl font-bold mb-6 text-center">Key Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <FeatureCard 
          icon={<Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />}
          title="Voice Spaces"
          description="High-fidelity audio rooms with spatial sound for immersive conversations"
        />
        
        <FeatureCard 
          icon={<Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />}
          title="Live Streaming"
          description="Broadcast in HD with real-time audience interaction and smart engagement"
        />
        
        <FeatureCard 
          icon={<Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />}
          title="Smart Discovery"
          description="Find trending content and creators matched to your interests"
        />
      </div>
    </div>
    
    {/* Room Types */}
    <div className="mt-12 sm:mt-16">
      <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Popular Spaces</h2>
      <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:overflow-visible scrollbar-hide">
        <RoomTypeTag 
          icon={<Music className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
          label="Music Sessions"
        />
        <RoomTypeTag 
          icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
          label="Discussion Lounges"
        />
        <RoomTypeTag 
          icon={<Video className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
          label="Video Spaces"
        />
        <RoomTypeTag 
          icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
          label="Community Hubs"
        />
      </div>
    </div>

    {/* CTA Section */}
    <div className="mt-16 backdrop-blur-md bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-2xl p-6 sm:p-8 border border-purple-500/20 shadow-lg text-center">
      <h3 className="text-lg sm:text-xl font-semibold mb-2">Ready to connect?</h3>
      <p className="text-sm sm:text-base text-gray-300 mb-4 max-w-xl mx-auto">
        Join thousands of others in audio and video rooms with crystal clear quality.
      </p>
      <ActionButton
        onClick={() => onContinue(ROUTES.ROOMS)}
        primary
        className="max-w-xs mx-auto"
        ariaLabel="Get started with Vibe"
      >
        Get Started
        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
      </ActionButton>
    </div>
  </>
)), { ssr: false });

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [showSecondary, setShowSecondary] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Load secondary content after initial render
    const timer = setTimeout(() => setShowSecondary(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state only while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-b-transparent border-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render until mounted (client-side)
  if (!mounted) return null;

  const handleContinue = (path: typeof ROUTES[keyof typeof ROUTES]) => {
    try {
      // If user is authenticated, go directly to path
      if (user) {
        router.push(path);
        return;
      }
      // Route to onboarding for everyone else - enables guest authentication
      router.push(ROUTES.ONBOARDING);
    } catch (error) {
      console.error('Error in handleContinue:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#0d0d12" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      
      <div className="min-h-screen text-white bg-[#0d0d12] overscroll-none">
        {/* Decorative background elements - optimized with reduced opacity */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d12] via-[#0d0d12] to-[#131320]"></div>
          <div className="absolute top-[5%] -left-[10%] w-[50%] h-[30%] bg-purple-600/5 rounded-full blur-[120px] opacity-30"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[20%] bg-indigo-600/5 rounded-full blur-[100px] opacity-30"></div>
        </div>
        
        {/* Content layer */}
        <div className="relative z-10">
          {/* Header - sticky with reduced height on mobile */}
          <header className="sticky top-0 py-3 sm:py-4 backdrop-blur-md bg-black/20 border-b border-white/5 px-4 z-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => handleContinue(ROUTES.LOGIN)}
                  className="px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => router.push(ROUTES.SIGN_UP)}
                  className="px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
                >
                  Create Account
                </button>
                <button 
                  onClick={() => handleContinue(ROUTES.ROOMS)}
                  className="px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
                >
                  Rooms
                </button>
              </div>
            </div>
          </header>
        
          <main>
            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12">
              {/* Hero Section - optimized for immediate visibility */}
              <div className="text-center">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400">
                    Audio & Video Rooms
                  </span>
                  <span className="inline-block ml-1 will-change-transform">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 inline" aria-hidden="true" />
                  </span>
                </h1>
                <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join immersive conversations, discover trending content, and share your voice.
                  <span className="block mt-2 text-purple-400 text-sm sm:text-base font-medium">No account needed to get started.</span>
                </p>
                
                {/* Tab Selector - accessible pill toggle */}
                <div 
                  className="inline-flex rounded-full backdrop-blur-sm bg-black/20 p-1 border border-white/10 mb-6 sm:mb-8"
                  role="tablist"
                  aria-label="Join or create options"
                >
                  <button
                    role="tab"
                    id="join-tab"
                    aria-selected={activeTab === 'join'}
                    aria-controls="join-panel"
                    onClick={() => setActiveTab('join')}
                    className={`relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                      activeTab === 'join' 
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Join a Room
                  </button>
                  <button
                    role="tab"
                    id="create-tab"
                    aria-selected={activeTab === 'create'}
                    aria-controls="create-panel"
                    onClick={() => setActiveTab('create')}
                    className={`relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                      activeTab === 'create' 
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Create a Room
                  </button>
                </div>
                
                {/* Action Panel - accessible with tab indexing */}
                <div 
                  className="backdrop-blur-md bg-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg max-w-lg mx-auto mb-6 sm:mb-8"
                  role="tabpanel"
                  id={activeTab === 'join' ? 'join-panel' : 'create-panel'}
                  aria-labelledby={activeTab === 'join' ? 'join-tab' : 'create-tab'}
                >
                  {activeTab === 'join' ? (
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Join live conversations instantly</h3>
                      <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">No account required. Jump right into the action.</p>
                      <ActionButton
                        onClick={() => handleContinue(ROUTES.ROOMS)}
                        primary
                        ariaLabel="Join a room without an account"
                      >
                        Jump In Now
                        <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                      </ActionButton>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Create your own audio or video space</h3>
                      <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Start instantly as a guest or sign up for more features.</p>
                      <ActionButton
                        onClick={() => handleContinue(ROUTES.ROOMS)}
                        primary
                        ariaLabel="Create your own room"
                      >
                        Create Room
                        <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                      </ActionButton>
                      <div className="text-center">
                        <button 
                          onClick={() => router.push(ROUTES.SIGN_UP)}
                          className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Sign up for premium features
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dynamically load secondary content for optimal performance */}
              {showSecondary && <SecondaryContent onContinue={handleContinue} />}
            </div>
          </main>
          
          {/* Footer - minimal and clean */}
          <footer className="text-center text-xs sm:text-sm text-gray-500 py-6 border-t border-gray-800 backdrop-blur-sm bg-black/10">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-1 sm:p-1.5 rounded-lg shadow-sm mr-2">
                  <Headphones className="w-3 h-3 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
                </div>
                <span className="font-medium">vibe</span>
              </div>
              <p> 2025 Vibe. The future of live audio & video spaces.</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
