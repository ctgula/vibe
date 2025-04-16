import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "@/components/Providers"
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '@/hooks/use-supabase-auth';

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Vibe",
  description: "Next generation audio collaboration",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#000000",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className="dark antialiased" 
      suppressHydrationWarning
      style={{ 
        colorScheme: 'dark',
        WebkitTextSizeAdjust: '100%',
      }}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body 
        className={`bg-black text-white ${inter.className} overflow-x-hidden overscroll-none`} 
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
          MozOsxFontSmoothing: "grayscale"
        }}
      >
        <AuthProvider>
          <ToastProvider>
            <Providers>
              {children}
            </Providers>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
