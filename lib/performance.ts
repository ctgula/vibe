/**
 * Performance optimization utilities for Apple-level PWA experience
 * These functions help optimize the app's loading speed and responsiveness
 */

// Detect if the app is running in standalone mode (installed as PWA)
export const isRunningAsStandalone = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }
  return false;
};

// Preload critical resources
export const preloadCriticalResources = (): void => {
  if (typeof window === 'undefined') return;
  
  // Critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.href = '/_next/static/css/app.css';
  criticalCSS.as = 'style';
  document.head.appendChild(criticalCSS);
  
  // Critical fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontPreload.as = 'style';
  document.head.appendChild(fontPreload);
  
  // Preconnect to Supabase
  const supabasePreconnect = document.createElement('link');
  supabasePreconnect.rel = 'preconnect';
  supabasePreconnect.href = 'https://api.supabase.io';
  document.head.appendChild(supabasePreconnect);
};

// Optimize images with IntersectionObserver
export const setupLazyLoading = (): void => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });
  
  // Apply to all images with data-src attribute
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
};

// Register event listeners for PWA lifecycle events
export const registerPWAEventListeners = (): void => {
  if (typeof window === 'undefined') return;
  
  // Handle beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from automatically showing the prompt
    e.preventDefault();
    // Store the event for later use
    (window as any).deferredPrompt = e;
  });
  
  // Handle app installed
  window.addEventListener('appinstalled', () => {
    // Clear the deferredPrompt
    (window as any).deferredPrompt = null;
    // Log or track installation
    console.log('PWA was installed');
  });
};

// Optimize touch interactions for mobile
export const optimizeTouchInteractions = (): void => {
  if (typeof document === 'undefined') return;
  
  // Add touch action manipulation
  document.addEventListener('touchstart', () => {}, { passive: true });
  
  // Fix 300ms tap delay
  const touchStyle = document.createElement('style');
  touchStyle.innerHTML = `
    a, button, .clickable {
      touch-action: manipulation;
    }
  `;
  document.head.appendChild(touchStyle);
};

// Initialize all performance optimizations
export const initializePerformanceOptimizations = (): void => {
  if (typeof window === 'undefined') return;
  
  // Run on next tick to avoid blocking render
  setTimeout(() => {
    preloadCriticalResources();
    setupLazyLoading();
    registerPWAEventListeners();
    optimizeTouchInteractions();
  }, 0);
};
