import "./globals.css"
import "./pwa.css"  // Import the PWA optimizations
import "./ios-startup.css"  // Import iOS-specific styles
import { Inter } from "next/font/google"
import { ReactNode } from 'react'
import Providers from './providers'
import { Viewport } from 'next'
import dynamic from 'next/dynamic'

// Dynamically import the Favicon component with no SSR
const Favicon = dynamic(() => import('./favicon'), {
  ssr: false
});

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI'],
})

export const metadata = {
  title: "Vibe",
  description: "Next generation audio collaboration",
  manifest: "/manifest.json",
  // Theme color moved to viewport export
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vibe",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Vibe",
    "application-name": "Vibe",
    "msapplication-TileColor": "#38bdf8",
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#38bdf8", // Match theme color with manifest.json
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html 
      lang="en" 
      className={`dark antialiased ${inter.className}`}
      suppressHydrationWarning
      style={{ 
        colorScheme: 'dark',
        WebkitTextSizeAdjust: '100%',
      }}
    >
      <head>
        {typeof window !== 'undefined' && <Favicon />}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Vibe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#38bdf8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* iPhone splash screens - these help avoid white flashes when launching from home screen */}
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-2048-2732.png" media="(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-1668-2388.png" media="(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-1536-2048.png" media="(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-1125-2436.png" media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-1242-2688.png" media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-828-1792.png" media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-1242-2208.png" media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-750-1334.png" media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-dark-640-1136.png" media="(prefers-color-scheme: dark) and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        
        {/* Add iOS height fix script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // iOS height calculation fix
              function setAppHeight() {
                document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
              }
              
              // Run on page load
              if (typeof window !== 'undefined') {
                window.addEventListener('resize', setAppHeight);
                window.addEventListener('orientationchange', setAppHeight);
                setAppHeight();
              }
            `,
          }}
        />
      </head>
      <body 
        className="bg-black text-white overflow-x-hidden ios-prevent-bounce ios-safe-area prevent-ios-tap"
        suppressHydrationWarning
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          WebkitOverflowScrolling: "touch",
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          touchAction: "manipulation",
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          isolation: "isolate",
        }}
      >
        {/* Remove direct access to DOM during SSR */}
        {typeof window !== 'undefined' && (
          <div id="ios-splash-screen" className="ios-splash-screen">
            <div className="ios-splash-logo">
              <div className="ios-splash-logo-inner">V</div>
            </div>
            <div className="ios-splash-app-name">Vibe</div>
            <div className="ios-splash-loader"></div>
          </div>
        )}
        
        <Providers>
          <div id="app-root" className="relative ios-safe-area">
            {children}
          </div>
        </Providers>
        
        {/* iOS scripts - client side only */}
        {typeof window !== 'undefined' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Prevent iOS double-tap zoom
                document.addEventListener('touchend', function(e) {
                  var targetElement = e.target;
                  
                  // Allow taps on inputs and controls
                  if (
                    targetElement.tagName === 'INPUT' || 
                    targetElement.tagName === 'TEXTAREA' || 
                    targetElement.tagName === 'SELECT' || 
                    targetElement.tagName === 'BUTTON' ||
                    targetElement.tagName === 'A' ||
                    targetElement.getAttribute('role') === 'button'
                  ) {
                    return true;
                  }
                  
                  var now = Date.now();
                  var lastTouch = targetElement.dataset.lastTouch || 0;
                  var delta = now - lastTouch;
                  
                  if (delta < 500) {
                    e.preventDefault(); // Prevent zoom
                    return false;
                  }
                  
                  targetElement.dataset.lastTouch = now;
                }, {passive: false});
                
                // Handle guest auth persistence
                function checkGuestSession() {
                  const guestId = localStorage.getItem('guestProfileId');
                  if (guestId) {
                    console.log('Found guest session:', guestId);
                    // Guest session will be handled by the app's auth context
                  }
                }
                
                // Handle iOS splash screen
                document.addEventListener('DOMContentLoaded', function() {
                  const splashScreen = document.getElementById('ios-splash-screen');
                  if (splashScreen) {
                    // Hide splash screen after app loaded
                    setTimeout(function() {
                      splashScreen.classList.add('loaded');
                      // Remove from DOM after animation completes
                      setTimeout(function() {
                        splashScreen.remove();
                      }, 500);
                    }, 1500);
                  }
                  
                  // Check for guest session
                  checkGuestSession();
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
