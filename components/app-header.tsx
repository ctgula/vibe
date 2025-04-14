"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, User, LogOut, Settings, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeSelector } from "@/components/ThemeSelector"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/auth"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function AppHeader({ title, showBackButton }: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, profile, signOut, guestId, isGuest } = useAuth()

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      // Focus the search input with a slight delay to ensure the sheet is open
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 300)
    }
  }, [searchOpen])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleNotificationClick = () => {
    // Navigate to notifications page
    router.push('/notifications')
    setNotificationCount(0)
  }

  const handleProfileClick = () => {
    // Check if user is authenticated or a guest
    if (user || guestId) {
      router.push('/profile');
    } else {
      // If no authenticated user or guest, redirect to login
      router.push('/auth/login');
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.substring(0, 2).toUpperCase();
    } else if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    } else if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    } else if (isGuest) {
      return "GU";
    }
    return "U";
  }

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${user?.id || guestId || 'guest'}`;
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 shadow-lg" : "bg-transparent"
      }`}
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand or Back Button + Title */}
          <div className="flex items-center">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Link href="/" className="flex items-center group">
                <div className="relative w-8 h-8 mr-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300"></div>
                  <div className="absolute inset-[2px] bg-black rounded-[6px] flex items-center justify-center text-white font-bold text-lg">V</div>
                </div>
              </Link>
            )}
            
            {title && (
              <h1 className="text-xl font-semibold text-white">{title}</h1>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-1">
            {/* Search */}
            <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="max-w-md mx-auto rounded-b-2xl border-t-0 mt-16 bg-zinc-900/95 backdrop-blur-xl border-zinc-800">
                <div className="py-4">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search rooms, topics, people..."
                    className="bg-zinc-800/50 border-zinc-700 focus-visible:ring-indigo-500"
                  />
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Design", "Tech", "AI", "Music", "Gaming"].map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="bg-zinc-800/70 hover:bg-zinc-700 border-zinc-700 text-zinc-300 cursor-pointer"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Home */}
            {!showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => router.push('/')}
              >
                <Home className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full relative"
              onClick={handleNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-600 rounded-full text-[10px] flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full overflow-hidden hover:ring-2 hover:ring-indigo-500/50 transition-all duration-300"
                >
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={getAvatarUrl()} alt="Profile" />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-2 bg-zinc-900/95 backdrop-blur-xl border-zinc-800">
                <DropdownMenuLabel>
                  {profile?.display_name || (isGuest ? "Guest User" : "My Account")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 hover:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isGuest ? "Exit Guest Mode" : "Sign Out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <ThemeSelector />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
