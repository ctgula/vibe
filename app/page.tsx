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
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('join');
  const [showSecondary, setShowSecondary] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [windowHeight, setWindowHeight] = useState('100%');

  // Handle iOS-specific viewport issues
  useEffect(() => {
    // Handle orientation changes
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    // Handle iOS viewport height
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setWindowHeight(`${window.innerHeight}px`);
      checkOrientation();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial call
    handleResize();
    
    // Load secondary content after initial render
    const timer = setTimeout(() => setShowSecondary(true), 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Redirect based on user state
  useEffect(() => {
    if (!isLoading && user && user.onboarded === false) {
      router.push(ROUTES.ONBOARDING);
    }
  }, [isLoading, user, router]);

  // Handle continue action
  const handleContinue = (path: string) => {
    // First check if authenticated - this prevents loading issues
    if (path === ROUTES.ROOMS && !user && !isLoading) {
      // Redirect to sign in if trying to access rooms without authentication
      toast.info("Please sign in to access rooms");
      router.push(ROUTES.LOGIN);
      return;
    }
    
    // Otherwise proceed to requested path
    router.push(path as any);
  };

  return (
    <>
      <Head>
        <title>Vibe - Live Audio Rooms</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div 
        className="min-h-screen bg-black text-white ios-safe-area"
        style={{
          minHeight: `calc(var(--vh, 1vh) * 100)`,
          height: windowHeight
        }}
      >
        <div className="flex flex-col min-h-[inherit]">
          {/* Hero header area */}
          <main className="flex-1 relative pb-safe">
            <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-6 md:pb-8 max-w-6xl mx-auto">
              {/* Navigation */}
              <header className="flex justify-between items-center mb-8 sm:mb-10">
                <Logo />
                <div className="flex space-x-3">
                  <ActionButton
                    onClick={() => router.push(ROUTES.LOGIN)}
                    className="!w-auto text-sm ios-touch-fix"
                    ariaLabel="Log in to your account"
                  >
                    Log In
                  </ActionButton>
                  <ActionButton
                    onClick={() => router.push(ROUTES.SIGN_UP)}
                    primary
                    className="!w-auto text-sm ios-touch-fix"
                    ariaLabel="Sign up for an account"
                  >
                    Sign Up
                  </ActionButton>
                </div>
              </header>
              
              {/* Hero Section */}
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight">
                  Live Audio <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Rooms</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Connect through immersive conversations with spatial audio
                </p>
                
                {/* Tab buttons */}
                <div className="space-y-4 sm:space-y-6">
                  <div 
                    className="inline-flex p-1 bg-white/5 backdrop-blur-md rounded-full"
                    role="tablist"
                    aria-label="Join or create options"
                  >
                    <button
                      role="tab"
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
                    className="backdrop-blur-md bg-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg max-w-lg mx-auto mb-6 sm:mb-8 ios-form-element"
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
                          className="ios-touch-fix"
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
                          className="ios-touch-fix"
                        >
                          Create Room
                          <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                        </ActionButton>
                        <div className="text-center">
                          <button 
                            onClick={() => router.push(ROUTES.SIGN_UP)}
                            className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors py-2 px-4 ios-touch-fix"
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
            </div>
          </main>
          
          {/* Footer - minimal and clean */}
          <footer className="text-center text-xs sm:text-sm text-gray-500 py-6 pb-safe border-t border-gray-800 backdrop-blur-sm bg-black/10 mt-auto">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-1 sm:p-1.5 rounded-lg shadow-sm mr-2">
                  <Headphones className="w-3 h-3 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
                </div>
                <span className="font-medium">vibe</span>
              </div>
              <p>&copy; 2025 Vibe. The future of live audio & video spaces.</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
