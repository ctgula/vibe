import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "@/components/Providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata = {
  title: "Vibe - Live Audio Rooms",
  description: "Connect through live audio rooms with spatial audio",
  manifest: "/manifest.json",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-black text-white" suppressHydrationWarning>
      <body className={`bg-black text-white ${inter.className}`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
