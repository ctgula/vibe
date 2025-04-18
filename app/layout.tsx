import "./globals.css"
import { Inter } from "next/font/google"
import { ReactNode } from 'react'
import Providers from './providers'
import { Viewport } from 'next'

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
  themeColor: "#000000",
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
    "msapplication-TileColor": "#000000",
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Vibe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body 
        className="bg-black text-white overflow-x-hidden overscroll-none"
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
        }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
