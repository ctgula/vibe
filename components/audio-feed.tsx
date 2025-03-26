"use client"

import { useState } from "react"
import { AudioPost } from "@/components/audio-post"

// Mock data for audio posts
const mockPosts = [
  {
    id: "1",
    username: "audioCreator",
    title: "Morning thoughts on tech",
    duration: 32,
    likes: 1245,
    comments: 89,
    shares: 45,
    audioUrl: "/sample-audio-1.mp3",
    userAvatar: "/placeholder.svg?height=50&width=50",
  },
  {
    id: "2",
    username: "podcastQueen",
    title: "Quick story about my day",
    duration: 45,
    likes: 2890,
    comments: 134,
    shares: 78,
    audioUrl: "/sample-audio-2.mp3",
    userAvatar: "/placeholder.svg?height=50&width=50",
  },
  {
    id: "3",
    username: "voiceArtist",
    title: "Hot take on the latest movie",
    duration: 28,
    likes: 943,
    comments: 67,
    shares: 23,
    audioUrl: "/sample-audio-3.mp3",
    userAvatar: "/placeholder.svg?height=50&width=50",
  },
]

export function AudioFeed() {
  const [currentPostIndex, setCurrentPostIndex] = useState(0)

  const handleNext = () => {
    setCurrentPostIndex((prev) => (prev + 1) % mockPosts.length)
  }

  const handlePrevious = () => {
    setCurrentPostIndex((prev) => (prev - 1 + mockPosts.length) % mockPosts.length)
  }

  return (
    <div className="relative h-[calc(100vh-8rem)]">
      <div
        className="absolute inset-0"
        onTouchStart={(e) => {
          const startY = e.touches[0].clientY
          const handleTouchEnd = (e: TouchEvent) => {
            const endY = e.changedTouches[0].clientY
            if (endY < startY - 50) {
              handleNext()
            } else if (endY > startY + 50) {
              handlePrevious()
            }
            document.removeEventListener("touchend", handleTouchEnd)
          }
          document.addEventListener("touchend", handleTouchEnd)
        }}
      >
        <AudioPost post={mockPosts[currentPostIndex]} />
      </div>
    </div>
  )
}

