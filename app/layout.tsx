import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-supabase-auth"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Vibe - Live Audio Rooms",
  description: "Connect through live audio rooms with spatial audio",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
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
