import "./globals.css"
import "./pwa.css"
import { Inter } from "next/font/google"
import { ReactNode } from 'react'
import Providers from './providers'
import { Viewport } from 'next'
import { Favicon } from './favicon'

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
        <Favicon />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Vibe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#38bdf8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body 
        className="bg-black text-white overflow-x-hidden overscroll-none min-h-screen min-h-[100dvh] fixed inset-0 w-full"
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
          contain: "content",
          contentVisibility: "auto",
          // Add safe area insets for modern devices with notches
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <Providers>
          <div id="app-root" className="fixed inset-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
