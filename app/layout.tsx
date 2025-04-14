import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "@/components/Providers"
import Script from "next/script"
import { useEffect } from 'react';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata = {
  title: "Vibe - Live Audio Rooms",
  description: "Connect through live audio rooms with spatial audio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vibe",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5, // Allow zooming for accessibility
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon.ico", sizes: "48x48", type: "image/x-icon" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true, // Better for accessibility
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#38bdf8" }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }, []);
  return (
    <html lang="en" className="bg-black text-white" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#38bdf8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vibe" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#38bdf8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        {/* Splash screens for iOS devices (2025 sizes) */}
        <link rel="apple-touch-startup-image" href="/launch/launch-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/launch/launch-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/launch/launch-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        {/* Add more splash screens for other devices as needed */}
      </head>
      <body className={`min-h-screen bg-black text-white ${inter.className}`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right">
            {children}
          </div>
        </Providers>
        <Script id="pwa-handler" strategy="afterInteractive">
          {`
            // Handle PWA installation and updates
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('PWA service worker registered:', registration.scope);
                  
                  // Check for updates
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New service worker installing');
                    
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New content available, please refresh');
                        // You could show a notification to the user here
                        if (confirm('New version available! Reload to update?')) {
                          window.location.reload();
                        }
                      }
                    });
                  });
                }).catch(error => {
                  console.error('Service worker registration failed:', error);
                });
              });
            }

            // Add smooth scrolling and touch optimizations
            document.addEventListener('touchstart', function() {}, {passive: true});
            
            // Prevent double-tap zoom on iOS
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function(event) {
              const now = Date.now();
              if (now - lastTouchEnd <= 300) {
                event.preventDefault();
              }
              lastTouchEnd = now;
            }, {passive: false});
            
            // Optimize for iOS devices
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
              document.documentElement.classList.add('ios-device');
            }
          `}
        </Script>
      </body>
    </html>
  )
}
