"use client"

import { useState } from "react"
import { MediaPost } from "@/components/media-post"

// Mock data for media posts
const mockPosts = [
  {
    id: "1",
    username: "audioCreator",
    title: "Morning thoughts on tech",
    duration: 32,
    likes: 1245,
    comments: 89,
    shares: 45,
    mediaUrl: "/sample-audio-1.mp3",
    userAvatar: "/placeholder.svg?height=50&width=50",
    hasVideo: false,
  },
  {
    id: "2",
    username: "podcastQueen",
    title: "Quick story about my day",
    duration: 45,
    likes: 2890,
    comments: 134,
    shares: 78,
    mediaUrl: "/sample-audio-2.mp3",
    userAvatar: "/placeholder.svg?height=50&width=50",
    hasVideo: false,
  },
  {
    id: "3",
    username: "voiceArtist",
    title: "Hot take on the latest movie",
    duration: 28,
    likes: 943,
    comments: 67,
    shares: 23,
    mediaUrl: "/sample-audio-3.mp3",
    userAvatar: "/placeholder.svg?height=50&width=50",
    hasVideo: false,
  },
]

export function MediaFeed() {
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
        <MediaPost post={mockPosts[currentPostIndex]} />
      </div>
    </div>
  )
}

