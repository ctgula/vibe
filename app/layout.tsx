import "./globals.css"
import "./pwa.css"  // Import the PWA optimizations
import "./ios-startup.css"  // Import iOS-specific styles
import { Inter } from "next/font/google"
import { ReactNode } from 'react'
import Providers from './providers'
import { Viewport } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Vibe | Live Audio Rooms',
  description: 'Connect through live audio rooms with spatial audio',
  manifest: '/manifest.json',
  themeColor: '#38bdf8',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vibe'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-167x167.png', sizes: '167x167', type: 'image/png' }
    ]
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#38bdf8'
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
        {/* Static favicon links - no dynamic component needed */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icons/icon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
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
        
        {/* Add iOS height fix script - safely wrapped for SSR */}
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
        {/* Client-side only splash screen */}
        <div id="ios-splash-screen" className="ios-splash-screen" style={{ display: 'none' }}>
          <div className="ios-splash-logo">
            <div className="ios-splash-logo-inner">V</div>
          </div>
          <div className="ios-splash-app-name">Vibe</div>
          <div className="ios-splash-loader"></div>
        </div>
        
        <Providers>
          <div id="app-root" className="relative ios-safe-area">
            {children}
          </div>
        </Providers>
        
        {/* iOS scripts - safely wrapped for SSR */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Show splash screen for iOS PWA
                const splashScreen = document.getElementById('ios-splash-screen');
                if (splashScreen) {
                  // Only show on iOS PWA mode
                  if (
                    window.navigator.standalone || 
                    window.matchMedia('(display-mode: standalone)').matches
                  ) {
                    splashScreen.style.display = 'flex';
                    
                    // Hide splash screen after app loaded
                    setTimeout(function() {
                      splashScreen.classList.add('loaded');
                      // Remove from DOM after animation completes
                      setTimeout(function() {
                        splashScreen.remove();
                      }, 500);
                    }, 1500);
                  }
                }
                
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
                const guestId = localStorage.getItem('guestProfileId');
                if (guestId) {
                  console.log('Found guest session:', guestId);
                  // Guest session will be handled by the app's auth context
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
