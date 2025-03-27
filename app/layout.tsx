import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-supabase-auth"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import the SplashScreen component to avoid SSR issues
const SplashScreen = dynamic(() => import('@/components/splash-screen').then(mod => mod.SplashScreen), {
  ssr: false
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Vibe - Live Audio Rooms",
  description: "Connect through live audio rooms with spatial audio",
  manifest: "/manifest.json",
  themeColor: "#38bdf8",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vibe",
  },
  applicationName: "Vibe",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/icons/splash-screen.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <SplashScreen />
              {children}
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#38bdf8',
                secondary: '#000',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#000',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
