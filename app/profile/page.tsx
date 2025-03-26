"use client"

import { Navigation } from "@/components/navigation"
import { motion } from "framer-motion"
import { Profile } from "@/components/profile"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-blue-900">
      <Navigation />
      <motion.main 
        className="container max-w-md mx-auto pt-16 pb-20 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      >
        <motion.div 
          className="backdrop-blur-md bg-black/30 p-6 rounded-xl border border-white/10 shadow-xl"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: 0.1,
            ease: [0.19, 1, 0.22, 1] // iOS-like easing
          }}
        >
          <Profile />
        </motion.div>
      </motion.main>
    </div>
  )
}
