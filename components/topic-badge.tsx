"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface TopicBadgeProps {
  topic: {
    name: string
    count: number
  }
  onClick: () => void
  isActive: boolean
}

export function TopicBadge({ topic, onClick, isActive }: TopicBadgeProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={`rounded-full text-xs h-8 ${isActive ? "cosmic-button" : "cosmic-glow glass-effect"} haptic-feedback`}
      onClick={() => {
        // Add haptic feedback if available
        if ("vibrate" in navigator) {
          navigator.vibrate(5)
        }
        onClick()
      }}
    >
      {topic.name}
      <motion.span
        className={`ml-1 text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {topic.count}
      </motion.span>
    </Button>
  )
}

