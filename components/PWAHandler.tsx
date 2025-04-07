'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, CheckCircle } from 'lucide-react';

export function PWAHandler() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [installBannerPosition, setInstallBannerPosition] = useState<'bottom' | 'top'>('bottom');
  const [initialAnimation, setInitialAnimation] = useState(true);

  useEffect(() => {
    // Detect if we're running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Position banner at top for iOS (better UX for Safari PWA installation)
    if (isIOS) {
      setInstallBannerPosition('top');
    }

    // Register service worker with better error handling and update detection
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            
            // Check for updates on page load
            registration.update();
            
            // Setup update detection
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show update notification
                    setUpdateAvailable(true);
                    setWaitingWorker(newWorker);
                  }
                });
              }
            });
            
            // Check for updates every 30 minutes while app is open
            const updateInterval = setInterval(() => {
              registration.update();
              console.log('Checking for service worker updates...');
            }, 30 * 60 * 1000);
            
            return () => clearInterval(updateInterval);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });

      // Handle communication from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('New content is available: ', event.data.payload);
          setUpdateAvailable(true);
        }
      });
    }

    // Handle PWA install prompt with improved detection
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      
      // Check if the app should show the install banner
      const hasSeenInstallBanner = localStorage.getItem('hasSeenInstallBanner');
      const lastBannerDismissTime = localStorage.getItem('lastBannerDismissTime');
      const now = Date.now();
      
      // Show banner if never seen or dismissed more than 1 week ago
      if (!hasSeenInstallBanner || 
          (lastBannerDismissTime && (now - parseInt(lastBannerDismissTime, 10)) > 7 * 24 * 60 * 60 * 1000)) {
        setShowInstallBanner(true);
      }
    });

    // More accurate installed detection
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    checkIfInstalled();

    // Update display mode in real-time if it changes
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    displayModeMediaQuery.addEventListener('change', () => {
      checkIfInstalled();
    });

    // Listen for app install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('hasSeenInstallBanner', 'true');
      console.log('PWA was installed');
    });

    // Hide initial animation after 5 seconds
    const timer = setTimeout(() => {
      setInitialAnimation(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      displayModeMediaQuery.removeEventListener('change', checkIfInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User ${outcome} the installation`);
    
    // We no longer need the prompt. Clear it.
    setInstallPrompt(null);
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    } else {
      // User declined, remember when they dismissed
      localStorage.setItem('lastBannerDismissTime', Date.now().toString());
    }
  };

  const handleCloseClick = () => {
    setShowInstallBanner(false);
    localStorage.setItem('hasSeenInstallBanner', 'true');
    localStorage.setItem('lastBannerDismissTime', Date.now().toString());
  };

  const handleUpdateClick = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const bannerVariants = {
    hidden: (position: string) => ({
      y: position === 'top' ? -100 : 100,
      opacity: 0
    }),
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    exit: (position: string) => ({
      y: position === 'top' ? -100 : 100,
      opacity: 0,
      transition: {
        duration: 0.3
      }
    })
  };

  // Don't render anything if installed and no updates
  if (isInstalled && !updateAvailable && !initialAnimation) return null;

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !isInstalled && (
          <motion.div
            className={`fixed ${installBannerPosition === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 m-4 z-50`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={bannerVariants}
            custom={installBannerPosition}
          >
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 backdrop-blur-lg border border-indigo-700/30 shadow-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-700/50 backdrop-blur-sm flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-white font-medium text-sm">Install Vibe App</h3>
                  <p className="text-indigo-200 text-xs mt-1">
                    For the best experience, add this app to your home screen
                  </p>
                </div>
                <div className="flex-shrink-0 flex space-x-2">
                  <button
                    onClick={handleCloseClick}
                    className="p-2 rounded-lg hover:bg-indigo-800/60 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-indigo-200" />
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Install
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Banner */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 m-4 z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={bannerVariants}
            custom="bottom"
          >
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/90 to-green-800/90 backdrop-blur-lg border border-green-700/30 shadow-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-green-700/50 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-white font-medium text-sm">Update Available</h3>
                  <p className="text-green-200 text-xs mt-1">
                    A new version of Vibe is ready to use
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handleUpdateClick}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Update Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial Installation Success Animation - shown briefly after install */}
      <AnimatePresence>
        {isInstalled && initialAnimation && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 p-6 rounded-2xl border border-zinc-700/30 shadow-2xl max-w-sm w-full mx-4"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </motion.div>
                <h2 className="text-xl font-semibold text-white mb-2">Installation Complete</h2>
                <p className="text-zinc-300 text-sm">
                  Vibe has been successfully installed on your device.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
