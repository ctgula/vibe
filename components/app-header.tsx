"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function AppHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    // Simulate reading notifications
    setNotificationCount(0)
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "glass-effect shadow-sm" : "bg-transparent"
      }`}
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="container max-w-md mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="font-bold text-xl">Vibe</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Trigger */}
            <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-[hsl(var(--secondary))]"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="pt-12 px-4">
                <div className="flex flex-col space-y-4">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for rooms, people, or topics..."
                    className="pl-3 h-12 text-lg"
                  />
                  <div className="py-2">
                    <h3 className="font-semibold mb-2">Recent Searches</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 hover:bg-[hsl(var(--secondary))] rounded-lg transition-colors cursor-pointer">
                        <span>Music Production</span>
                        <button className="text-xs opacity-60">Clear</button>
                      </div>
                      <div className="flex items-center justify-between p-2 hover:bg-[hsl(var(--secondary))] rounded-lg transition-colors cursor-pointer">
                        <span>Tech Talk</span>
                        <button className="text-xs opacity-60">Clear</button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-[hsl(var(--secondary))]"
              onClick={handleNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs rounded-full">
                  {notificationCount}
                </span>
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-[hsl(var(--secondary))]"
              onClick={toggleTheme}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mounted && (
                  <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
