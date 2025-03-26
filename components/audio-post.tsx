"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, Share2, Play, Pause } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface AudioPostProps {
  post: {
    id: string
    username: string
    title: string
    duration: number
    likes: number
    comments: number
    shares: number
    audioUrl: string
    userAvatar: string
  }
}

export function AudioPost({ post }: AudioPostProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(post.audioUrl)
      audioRef.current.addEventListener("timeupdate", updateProgress)
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("timeupdate", updateProgress)
        audioRef.current.removeEventListener("ended", () => {
          setIsPlaying(false)
          setCurrentTime(0)
        })
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [post.audioUrl])

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play()
      visualizeAudio()
    } else {
      audioRef.current?.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const visualizeAudio = () => {
    if (!canvasRef.current || !audioRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Create a simple audio visualization
    const barCount = 60
    const barWidth = width / barCount

    for (let i = 0; i < barCount; i++) {
      // Generate random heights for demo purposes
      // In a real app, you'd use AudioContext and analyser to get frequency data
      const barHeight = isPlaying ? Math.random() * height * 0.8 + height * 0.2 : height * 0.3

      const hue = (i / barCount) * 180 + 180 // Blue to purple gradient
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`

      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
    }

    animationRef.current = requestAnimationFrame(visualizeAudio)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const progressPercentage = (currentTime / post.duration) * 100

  return (
    <Card className="h-full flex flex-col justify-between border-0 rounded-none">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center p-6">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="text-muted-foreground">@{post.username}</p>
          </div>

          <div className="w-full max-w-xs mb-8">
            <canvas ref={canvasRef} width={300} height={150} className="w-full h-[150px] rounded-lg" />
          </div>

          <div className="w-full max-w-xs">
            <div className="relative h-1 bg-muted rounded-full mb-2">
              <div className="absolute h-full bg-primary rounded-full" style={{ width: `${progressPercentage}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(post.duration)}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>
        </div>

        <div className="flex justify-between items-center p-6 border-t">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.userAvatar} alt={post.username} />
              <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">@{post.username}</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={isLiked ? "text-red-500" : ""}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className="h-6 w-6" />
              <span className="sr-only">Like</span>
            </Button>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Comment</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-6 w-6" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

