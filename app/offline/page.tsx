'use client';

import { motion, AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import type { Route } from 'next';
import { Wifi, WifiOff, Home, RefreshCw, ArrowLeft, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// This component will list available cached pages
const CachedPagesList = ({ onNavigate }: { onNavigate: () => void }) => {
  const [cachedPages, setCachedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCachedPages = async () => {
      try {
        // In a real implementation, this would be fetched from the cache API
        // For now, we'll mock some commonly accessed pages that might be cached
        // The service worker would need to expose this information
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setCachedPages([
          '/rooms',
          '/profile',
          '/notifications',
          '/',
          '/discover'
        ]);
      } catch (error) {
        console.error('Error fetching cached pages:', error);
        setCachedPages(['/']);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCachedPages();
  }, []);
  
  if (isLoading) {
    return (
      <div className="py-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-3 h-3 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    );
  }
  
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-2"
    >
      <h3 className="text-sm font-medium text-zinc-400 mb-2">Available offline:</h3>
      <div className="space-y-1">
        {cachedPages.map((page, index) => (
          <Link 
            href={page as Route}
            key={page}
            onClick={onNavigate}
            className="flex items-center p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
          >
            <m.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex items-center w-full"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                {page === '/' ? (
                  <Home className="w-4 h-4 text-zinc-400" />
                ) : (
                  <History className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <span className="text-zinc-300 text-sm">{page === '/' ? 'Home' : page.charAt(1).toUpperCase() + page.slice(2)}</span>
              <ArrowLeft className="w-4 h-4 text-zinc-500 ml-auto transition-transform group-hover:translate-x-1" />
            </m.div>
          </Link>
        ))}
      </div>
    </m.div>
  );
};

export default function OfflinePage() {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCachedContent, setShowCachedContent] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const router = useRouter();
  
  // Responsive reconnection strategy
  // - First few attempts: quick (3 seconds)
  // - Later attempts: increasingly longer intervals
  const getReconnectInterval = (attempts: number) => {
    if (attempts < 3) return 3;
    if (attempts < 5) return 5;
    if (attempts < 8) return 10;
    return 30;
  };
  
  // Auto-retry connection with exponential backoff
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isReconnecting) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        // Check connection
        if (navigator.onLine) {
          // Successful reconnect
          window.location.href = document.referrer || '/';
        } else {
          // Failed reconnect, increment attempts and set new interval
          const newAttempts = reconnectAttempts + 1;
          setReconnectAttempts(newAttempts);
          setIsReconnecting(false);
          
          // Auto retry after a delay proportional to attempt count
          setTimeout(() => {
            if (!navigator.onLine) {
              handleTryAgain();
            }
          }, 5000);
        }
      }
    }
    
    // Check online status to auto-exit offline page
    const handleOnline = () => {
      // Wait a moment to ensure the connection is stable
      setTimeout(() => {
        // Navigate back to the previous page or home
        window.location.href = document.referrer || '/';
      }, 1000);
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
    };
  }, [isReconnecting, countdown, reconnectAttempts]);
  
  const handleTryAgain = () => {
    setIsReconnecting(true);
    setCountdown(getReconnectInterval(reconnectAttempts));
  };
  
  const handleShowCachedContent = () => {
    setShowCachedContent(true);
  };
  
  const handleCachePagesNavigate = () => {
    setShowCachedContent(false);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 20
      }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <AnimatePresence mode="wait">
        {!showCachedContent ? (
          <m.div
            key="main-offline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full p-6 rounded-2xl bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl"
          >
            <m.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center text-center"
            >
              <m.div
                variants={itemVariants}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: [0.8, 1.2, 1],
                  rotateZ: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 0.8, 
                  times: [0, 0.3, 0.7, 1],
                  ease: "easeInOut"
                }}
                className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6"
              >
                <m.div
                  animate={{ 
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <WifiOff className="w-10 h-10 text-zinc-500" />
                </m.div>
              </m.div>
              
              <m.h2 
                variants={itemVariants}
                className="text-2xl font-bold text-white mb-2"
              >
                You're Offline
              </m.h2>
              
              <m.p
                variants={itemVariants}
                className="text-zinc-400 mb-6"
              >
                Check your connection and try again
              </m.p>
              
              <m.div
                variants={itemVariants}
                className="flex flex-col space-y-3 w-full"
              >
                {isReconnecting ? (
                  <div className="bg-zinc-800/70 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 relative">
                        <Wifi className="w-5 h-5 text-indigo-400" />
                        <m.div 
                          className="absolute inset-0"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Wifi className="w-5 h-5 text-indigo-400" />
                        </m.div>
                      </div>
                      <div className="text-left">
                        <p className="text-zinc-300 text-sm font-medium">Reconnecting...</p>
                        <p className="text-zinc-500 text-xs">Retrying in {countdown}s</p>
                      </div>
                    </div>
                    <m.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-5 h-5 text-indigo-400" />
                    </m.div>
                  </div>
                ) : (
                  <button
                    onClick={handleTryAgain}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                )}
                
                <button
                  onClick={handleShowCachedContent}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl text-zinc-300 text-sm"
                >
                  View Available Offline Content
                </button>
              </m.div>
            </m.div>
          </m.div>
        ) : (
          <m.div
            key="cached-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full p-6 rounded-2xl bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-xl border border-zinc-700/30 shadow-xl"
          >
            <div className="flex items-center mb-4">
              <button
                onClick={() => setShowCachedContent(false)}
                className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <h2 className="text-lg font-semibold text-white ml-2">Offline Content</h2>
            </div>
            
            <CachedPagesList onNavigate={handleCachePagesNavigate} />
            
            <div className="mt-6">
              <div className="bg-zinc-800/40 rounded-xl p-4">
                <div className="flex items-start">
                  <WifiOff className="w-5 h-5 text-zinc-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-zinc-400 text-sm">
                    You're browsing in offline mode. Some features may be limited and content may not be up-to-date.
                  </p>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
