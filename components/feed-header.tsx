"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Users, Flame } from "lucide-react"

interface FeedHeaderProps {
  mode: "discover" | "following" | "trending"
  onModeChange: (mode: "discover" | "following" | "trending") => void
}

export function FeedHeader({ mode, onModeChange }: FeedHeaderProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
        Vibe
      </h1>

      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as "discover" | "following" | "trending")}
        className="w-auto"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="discover" className="text-xs px-3">
            <Sparkles className="h-3 w-3 mr-1" />
            For You
          </TabsTrigger>
          <TabsTrigger value="following" className="text-xs px-3">
            <Users className="h-3 w-3 mr-1" />
            Following
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-xs px-3">
            <Flame className="h-3 w-3 mr-1" />
            Trending
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

