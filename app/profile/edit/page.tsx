"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Upload, Save, X } from "lucide-react"
import { motion } from "framer-motion"

// Mock user data (same as in user-profile.tsx)
const user = {
  username: "audioCreator",
  displayName: "Audio Creator",
  bio: "Creating audio content about tech, life, and everything in between. Join me for daily thoughts and stories!",
  followers: 1245,
  following: 342,
  avatar: "/placeholder.svg?height=100&width=100",
}

export default function EditProfilePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    username: user.username,
    bio: user.bio,
    avatar: user.avatar,
  })
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Apply haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(2) // Very short vibration for iOS-like feedback
    }
  }
  
  // Handle save
  const handleSave = () => {
    // Apply haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5) // Stronger vibration for confirmation
    }
    
    // In a real app, you would save the profile data to the server here
    console.log("Saving profile data:", formData)
    
    // Navigate back to profile page
    router.push("/profile")
  }
  
  // Handle back
  const handleBack = () => {
    // Apply haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(3) // Short vibration
    }
    
    router.back()
  }

  return (
    <div className="min-h-screen psychedelic-bg">
      <Navigation />
      <main className="container max-w-md mx-auto pt-16 pb-20 px-4">
        <motion.div 
          className="glass-effect p-6 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.div
              className="flex items-center gap-2"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBack}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </motion.div>
              <h1 className="text-xl font-bold">Edit Profile</h1>
            </motion.div>
            
            <motion.div 
              whileTap={{ scale: 0.9 }} 
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button 
                variant="default"
                size="sm"
                onClick={handleSave}
                className="rounded-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </motion.div>
          </div>
          
          {/* Avatar Upload Section */}
          <motion.div 
            className="flex flex-col items-center mb-8"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-white/20 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-blue-500/20 rounded-full backdrop-blur-sm"></div>
                <AvatarImage 
                  src={formData.avatar} 
                  alt={formData.displayName} 
                  className="object-cover scale-[1.01]"
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-700">
                  {formData.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="h-6 w-6 text-white" />
              </motion.div>
              
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-30 blur-md -z-10"
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.35, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <p className="text-sm text-white/70 mt-2">Tap to change profile photo</p>
          </motion.div>
          
          {/* Form Fields */}
          <motion.div 
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="bg-white/5 border-white/10 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">@</span>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 pl-8 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">Bio</label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="bg-white/5 border-white/10 resize-none focus-visible:ring-indigo-500"
              />
              <p className="text-xs text-white/50 text-right">{formData.bio.length}/160</p>
            </div>
          </motion.div>
          
          {/* Bottom Actions */}
          <motion.div 
            className="mt-8 pt-4 border-t border-white/10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Button 
              variant="outline" 
              className="w-full text-white bg-transparent border-white/10 hover:bg-white/5"
              onClick={handleBack}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
