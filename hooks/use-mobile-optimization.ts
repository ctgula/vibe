"use client";

import { useState, useEffect } from 'react';
import { isRunningAsPWA, isMobileDevice } from '@/lib/utils';

interface MobileOptimizationState {
  isMobile: boolean;
  isPWA: boolean;
  isOnline: boolean;
  isPortrait: boolean;
  viewportHeight: number;
}

export function useMobileOptimization(): MobileOptimizationState {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isPWA: false,
    isOnline: true,
    isPortrait: true,
    viewportHeight: 0,
  });

  useEffect(() => {
    // Initial setup
    const updateState = () => {
      setState({
        isMobile: isMobileDevice(),
        isPWA: isRunningAsPWA(),
        isOnline: navigator.onLine,
        isPortrait: window.innerHeight > window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    };

    // Set initial state
    updateState();

    // Add event listeners
    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);
    window.addEventListener('online', updateState);
    window.addEventListener('offline', updateState);
    
    // Fix for iOS Safari 100vh issue
    const handleVisualViewportResize = () => {
      document.documentElement.style.setProperty(
        '--vh', 
        `${window.visualViewport?.height || window.innerHeight}px`
      );
    };
    
    handleVisualViewportResize();
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
      window.removeEventListener('online', updateState);
      window.removeEventListener('offline', updateState);
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
    };
  }, []);

  return state;
}
