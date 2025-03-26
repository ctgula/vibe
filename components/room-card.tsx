"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mic, Video, Headphones } from "lucide-react"
import { motion } from "framer-motion"

interface RoomCardProps {
  room: {
    id: string
    title: string
    description?: string
    participants: number
    speakers: {
      id: string
      username: string
      avatar: string
      isSpeaking?: boolean
      hasVideo?: boolean
    }[]
    topics: string[]
    isLive: boolean
    scheduledFor?: string
  }
  onJoin: () => void
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation()
    onJoin()
  }

  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
      <Card
        className="cosmic-card overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
      >
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.1 : 0,
            background: "linear-gradient(135deg, #9D4EDD, #5390D9, #FF5DA2)",
            backgroundSize: "200%",
            animation: isHovered ? "background-pan 3s linear infinite" : "none",
          }}
        />

        <CardContent className="p-4 relative z-10">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3
                  className={`font-semibold text-base transition-all duration-300 ${isHovered ? "text-gradient" : ""}`}
                >
                  {room.title}
                </h3>
                {room.description && <p className="text-xs text-muted-foreground line-clamp-1">{room.description}</p>}
              </div>

              {room.isLive ? (
                <Button size="sm" onClick={handleJoin} className="cosmic-button">
                  Join
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="cosmic-glow" onClick={handleJoin}>
                  Remind
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {room.isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span>Live</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {room.participants}
                  </span>
                </>
              ) : (
                <span className="flex items-center">
                  <Headphones className="h-3 w-3 mr-1" />
                  {room.scheduledFor}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {room.topics.map((topic, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`text-xs font-normal glass-effect transition-all duration-300 ${isHovered ? "bg-primary/10" : ""}`}
                >
                  {topic}
                </Badge>
              ))}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Speakers</p>
                <div className="flex -space-x-2">
                  {room.speakers.map((speaker) => (
                    <div key={speaker.id} className="relative">
                      <Avatar
                        className={`border-2 border-background h-8 w-8 transition-all duration-300 ${
                          isHovered ? "ring-1 ring-primary/50" : ""
                        }`}
                      >
                        <AvatarImage src={speaker.avatar} alt={speaker.username} />
                        <AvatarFallback>{speaker.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      {speaker.isSpeaking && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 animate-pulse-subtle">
                          <Mic className="h-2 w-2" />
                        </div>
                      )}

                      {speaker.hasVideo && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 animate-pulse-subtle">
                          <Video className="h-2 w-2" />
                        </div>
                      )}
                    </div>
                  ))}

                  {room.speakers.length > 3 && (
                    <Avatar
                      className={`border-2 border-background h-8 w-8 bg-muted transition-all duration-300 ${
                        isHovered ? "ring-1 ring-primary/50" : ""
                      }`}
                    >
                      <AvatarFallback className="text-xs">+{room.speakers.length - 3}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {room.speakers.some((s) => s.hasVideo) && (
                  <Badge variant="outline" className="flex items-center gap-1 glass-effect">
                    <Video className="h-3 w-3" />
                    <span className="text-xs">Video</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

