"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusCircle, Users, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { NotificationsButton } from "@/components/ui/notifications-button"

export function Navigation() {
  const pathname = usePathname()
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [visible, setVisible] = useState(true)
  const [activeTab, setActiveTab] = useState("")
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  })
  
  // Create properly typed refs
  const navItemRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([])
  
  // Initialize refs on first render
  useEffect(() => {
    navItemRefs.current = Array(5)
      .fill(null)
      .map((_, i) => navItemRefs.current[i] || React.createRef<HTMLDivElement>())
  }, [])

  useEffect(() => {
    // Set active tab based on pathname
    const newActiveTab = pathname === "/" ? "/" : pathname.split("/")[1] || "/"
    setActiveTab(newActiveTab)
    
    // Position indicator
    const navItems = [
      { path: "/" },
      { path: "/discover" },
      { path: "/directory" },
      { path: "/room/create" },
      { path: "/profile" },
    ]
    
    const activeIndex = navItems.findIndex(item => {
      if (item.path === "/room/create" && (
          pathname === "/room/create" || 
          pathname === "/create-room"
        )) {
        return true;
      }
      return item.path === (newActiveTab === "/" ? "/" : `/${newActiveTab}`)
    })
    
    if (activeIndex >= 0 && navItemRefs.current[activeIndex]?.current) {
      const activeElement = navItemRefs.current[activeIndex].current
      if (activeElement) {
        const rect = activeElement.getBoundingClientRect()
        const containerRect = activeElement.parentElement?.getBoundingClientRect()
        
        if (containerRect) {
          setIndicatorStyle({
            left: rect.left - containerRect.left,
            width: rect.width,
          })
        }
      }
    }
  }, [pathname, activeTab])
  
  // Handle scroll hide/show with better performance
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false
    
    const handleScroll = () => {
      const currentScrollPos = window.scrollY
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(lastScrollY > currentScrollPos || currentScrollPos < 10)
          lastScrollY = currentScrollPos
          ticking = false
        })
        
        ticking = true
      }
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Apply haptic feedback for navigation items
  const handleNavPress = (label: string) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(3) // Very short vibration for iOS-like feedback
    }
    
    // Don't show toast when clicking currently active tab
    if (
      (label.toLowerCase() === activeTab) || 
      (label === "Home" && activeTab === "/") ||
      (label === "Create" && activeTab === "room/create")
    ) {
      return
    }
  }
  
  const handleNotification = () => {
    // No longer needed - notifications now handled by the NotificationsButton component
  }
  
  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: <Home className="h-6 w-6" />,
    },
    {
      path: "/discover",
      label: "Discover",
      icon: <Search className="h-6 w-6" />,
    },
    {
      path: "/directory",
      label: "Directory",
      icon: <Users className="h-6 w-6" />,
    },
    {
      path: "/room/create",
      label: "Create",
      icon: <PlusCircle className="h-6 w-6" />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User className="h-6 w-6" />,
    },
  ]
  
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      initial={{ y: 0 }}
      animate={{ y: visible ? 0 : 100 }}
      transition={{ duration: 0.2 }}
    >
      {/* Notification icon for top right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationsButton />
      </div>

      <div className="container max-w-md mx-auto py-2">
        <div className="flex items-center justify-between relative px-2">
          {/* Animated indicator */}
          <motion.div 
            className="absolute bottom-[3px] h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />
          
          {/* Navigation items */}
          <div className="w-full flex justify-between items-center glass-effect rounded-full py-2 px-4 backdrop-blur-xl bg-black/30 border border-white/10 shadow-lg">
            {navItems.map((item, index) => (
              <Link 
                key={item.path} 
                href={item.path as any}
                className="no-select"
                onClick={() => handleNavPress(item.label)}
              >
                <motion.div
                  ref={navItemRefs.current[index]}
                  className={`flex flex-col items-center relative py-1 px-2 rounded-full ${
                    activeTab === (item.path === "/" ? "/" : item.path.substring(1)) ||
                    (item.path === "/room/create" && activeTab === "room/create")
                      ? "text-white"
                      : "text-white/50 hover:text-white/70"
                  } transition-colors duration-200`}
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ 
                    y: -2,
                    transition: { duration: 0.1 }
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <motion.div
                    animate={
                      activeTab === (item.path === "/" ? "/" : item.path.substring(1)) ||
                      (item.path === "/room/create" && activeTab === "room/create")
                        ? { 
                            scale: [1, 1.15, 1],
                            transition: { duration: 0.3 }
                          }
                        : {}
                    }
                  >
                    {item.icon}
                  </motion.div>
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                  
                  {(activeTab === (item.path === "/" ? "/" : item.path.substring(1)) || 
                    (item.path === "/room/create" && activeTab === "room/create")) && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 w-1 h-1 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ translateX: "-50%" }}
                    />
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
