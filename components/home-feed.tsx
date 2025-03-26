"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Flame, Users, Headphones, Compass, Clock, Plus } from "lucide-react"
import { RoomCard } from "@/components/room-card"
import { TopicBadge } from "@/components/topic-badge"
import { useRouter } from "next/navigation"

// Mock live rooms data
const liveRooms = [
  {
    id: "1",
    title: "Tech Talk: Future of AI",
    description: "Discussing the latest advancements in artificial intelligence and what's coming next",
    participants: 245,
    speakers: [
      {
        id: "1",
        username: "techGuru",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: true,
        hasVideo: true,
      },
      {
        id: "2",
        username: "aiExpert",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: false,
        hasVideo: false,
      },
      {
        id: "3",
        username: "devLeader",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: false,
        hasVideo: false,
      },
    ],
    topics: ["Technology", "AI", "Future"],
    isLive: true,
  },
  {
    id: "2",
    title: "Music Production Tips",
    description: "Professional producers sharing their workflow secrets and favorite tools",
    participants: 128,
    speakers: [
      {
        id: "4",
        username: "beatMaker",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: true,
        hasVideo: true,
      },
      {
        id: "5",
        username: "vocalCoach",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: false,
        hasVideo: true,
      },
    ],
    topics: ["Music", "Production", "Creative"],
    isLive: true,
  },
  {
    id: "3",
    title: "Startup Funding Strategies",
    description: "VCs and founders discussing how to raise capital in the current market",
    participants: 89,
    speakers: [
      {
        id: "6",
        username: "vcInvestor",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: false,
        hasVideo: false,
      },
      {
        id: "7",
        username: "founderCEO",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: true,
        hasVideo: false,
      },
    ],
    topics: ["Startup", "Business", "Funding"],
    isLive: true,
  },
  {
    id: "4",
    title: "Mindfulness & Meditation",
    description: "Daily guided meditation session for stress relief and mental clarity",
    participants: 156,
    speakers: [
      {
        id: "8",
        username: "zenMaster",
        avatar: "/placeholder.svg?height=40&width=40",
        isSpeaking: true,
        hasVideo: false,
      },
    ],
    topics: ["Wellness", "Meditation", "Mental Health"],
    isLive: true,
  },
]

// Mock scheduled rooms
const scheduledRooms = [
  {
    id: "5",
    title: "Web3 and the Future of Finance",
    scheduledFor: "Today, 8:00 PM",
    participants: 0,
    speakers: [
      { id: "9", username: "cryptoExpert", avatar: "/placeholder.svg?height=40&width=40", hasVideo: false },
      { id: "10", username: "blockchainDev", avatar: "/placeholder.svg?height=40&width=40", hasVideo: false },
    ],
    topics: ["Crypto", "Web3", "Finance"],
    isLive: false,
  },
  {
    id: "6",
    title: "Creative Writing Workshop",
    scheduledFor: "Tomorrow, 6:30 PM",
    participants: 0,
    speakers: [{ id: "11", username: "novelist", avatar: "/placeholder.svg?height=40&width=40", hasVideo: false }],
    topics: ["Writing", "Creative", "Workshop"],
    isLive: false,
  },
]

// Mock trending topics
const trendingTopics = [
  { name: "Technology", count: 245 },
  { name: "Music", count: 189 },
  { name: "Business", count: 156 },
  { name: "Wellness", count: 132 },
  { name: "Creative", count: 98 },
  { name: "Education", count: 87 },
  { name: "Entertainment", count: 76 },
  { name: "Sports", count: 65 },
]

// Mock recommended users
const recommendedUsers = [
  {
    id: "1",
    username: "techGuru",
    displayName: "Tech Guru",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Discussing the latest in tech",
    isLive: true,
  },
  {
    id: "2",
    username: "musicProducer",
    displayName: "Music Producer",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Creating beats and sharing tips",
    isLive: false,
  },
  {
    id: "3",
    username: "startupFounder",
    displayName: "Startup Founder",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Building the next big thing",
    isLive: true,
  },
  {
    id: "4",
    username: "wellnessCoach",
    displayName: "Wellness Coach",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Mindfulness and healthy living",
    isLive: false,
  },
]

export function HomeFeed() {
  const [feedTab, setFeedTab] = useState("forYou")
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const router = useRouter()
  const feedRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabIndicatorRef = useRef<HTMLDivElement>(null)

  // Scroll animations
  const { scrollY } = useScroll()
  const blob1Y = useTransform(scrollY, [0, 500], [100, 200])
  const blob1X = useTransform(scrollY, [0, 500], [-100, -50])
  const blob2Y = useTransform(scrollY, [0, 500], [200, 300])
  const blob2X = useTransform(scrollY, [0, 500], [-150, -200])

  // Tab indicator animation
  useEffect(() => {
    if (tabsRef.current && tabIndicatorRef.current) {
      const tabs = tabsRef.current.querySelectorAll('[role="tab"]')
      const activeTab = tabsRef.current.querySelector('[data-state="active"]')

      if (activeTab) {
        const { offsetLeft, offsetWidth } = activeTab as HTMLElement
        tabIndicatorRef.current.style.width = `${offsetWidth}px`
        tabIndicatorRef.current.style.left = `${offsetLeft}px`
      }
    }
  }, [feedTab])

  // Intersection observers for animations
  const [liveRoomsRef, liveRoomsInView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const [topicsRef, topicsInView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const [scheduledRef, scheduledInView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const [peopleRef, peopleInView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // Filter rooms by topic if a topic filter is active
  const filteredLiveRooms = topicFilter ? liveRooms.filter((room) => room.topics.includes(topicFilter)) : liveRooms

  const handleJoinRoom = (roomId: string) => {
    // Add haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(10)
    }

    router.push(`/rooms/${roomId}`)
  }

  const handleCreateRoom = () => {
    // Add haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(10)
    }

    router.push("/create-room")
  }

  const handleTabChange = (value: string) => {
    // Add haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(5)
    }

    setFeedTab(value)
  }

  return (
    <div className="space-y-6 pb-6 relative" ref={feedRef}>
      {/* Cosmic background blobs */}
      <motion.div
        className="cosmic-blob w-64 h-64 opacity-20 rounded-full"
        style={{
          top: blob1Y,
          left: blob1X,
        }}
      />
      <motion.div
        className="cosmic-blob w-80 h-80 opacity-10 rounded-full"
        style={{
          bottom: blob2Y,
          right: blob2X,
        }}
      />

      {/* Feed tabs */}
      <div className="sticky top-16 z-10 pt-4 pb-2 glass-effect backdrop-blur-lg">
        <Tabs value={feedTab} onValueChange={handleTabChange} className="w-full">
          <div className="relative" ref={tabsRef}>
            <TabsList className="grid grid-cols-3 w-full glass-effect">
              <TabsTrigger
                value="forYou"
                className="text-sm data-[state=active]:text-primary data-[state=active]:bg-transparent relative z-10"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                For You
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="text-sm data-[state=active]:text-primary data-[state=active]:bg-transparent relative z-10"
              >
                <Users className="h-4 w-4 mr-2" />
                Following
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="text-sm data-[state=active]:text-primary data-[state=active]:bg-transparent relative z-10"
              >
                <Flame className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
            </TabsList>
            <div className="tab-indicator" ref={tabIndicatorRef} />
          </div>

          {/* Topic filters */}
          <div className="mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <motion.div
              className="flex space-x-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Button
                variant={topicFilter === null ? "default" : "outline"}
                size="sm"
                className={`rounded-full text-xs ${topicFilter === null ? "cosmic-button" : "cosmic-glow"}`}
                onClick={() => setTopicFilter(null)}
              >
                <Compass className="h-3 w-3 mr-1" />
                All
              </Button>

              {trendingTopics.slice(0, 6).map((topic, index) => (
                <Button
                  key={index}
                  variant={topicFilter === topic.name ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full text-xs whitespace-nowrap ${topicFilter === topic.name ? "cosmic-button" : "cosmic-glow"}`}
                  onClick={() => setTopicFilter(topic.name)}
                >
                  {topic.name}
                </Button>
              ))}
            </motion.div>
          </div>

          <TabsContent value="forYou" className="mt-0 space-y-6">
            {/* Create Room Button */}
            <motion.div
              className="flex justify-center"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Button
                onClick={handleCreateRoom}
                className="rounded-full shadow-lg hover:shadow-xl cosmic-button haptic-feedback"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </motion.div>

            {/* Live Rooms Section */}
            <motion.div
              ref={liveRoomsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={liveRoomsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="will-change-transform"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-gradient">Live Now</span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary text-xs cosmic-glow">
                  See All
                </Button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredLiveRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                      className="will-change-transform"
                    >
                      <RoomCard room={room} onJoin={() => handleJoinRoom(room.id)} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredLiveRooms.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 cosmic-card"
                  >
                    <Headphones className="h-10 w-10 mx-auto text-muted-foreground mb-2 animate-float" />
                    <p className="text-muted-foreground">No live rooms found for this topic</p>
                    <Button variant="link" onClick={() => setTopicFilter(null)} className="text-gradient mt-2">
                      View all rooms
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Trending Topics */}
            <motion.div
              ref={topicsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={topicsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="will-change-transform"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Flame className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-gradient">Trending Topics</span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary text-xs cosmic-glow">
                  Explore
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <TopicBadge
                      topic={topic}
                      onClick={() => setTopicFilter(topic.name)}
                      isActive={topicFilter === topic.name}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Scheduled Rooms */}
            <motion.div
              ref={scheduledRef}
              initial={{ opacity: 0, y: 20 }}
              animate={scheduledInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="will-change-transform"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-gradient">Upcoming Rooms</span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary text-xs cosmic-glow">
                  View Calendar
                </Button>
              </div>

              <div className="space-y-4">
                {scheduledRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <RoomCard key={room.id} room={room} onJoin={() => {}} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* People to Follow */}
            <motion.div
              ref={peopleRef}
              initial={{ opacity: 0, y: 20 }}
              animate={peopleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="will-change-transform"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-gradient">People to Follow</span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary text-xs cosmic-glow">
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {recommendedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ y: 0 }}
                  >
                    <div className="cosmic-card p-3 flex flex-col items-center text-center">
                      <div className="relative">
                        <Avatar className="h-16 w-16 mb-2 ring-1 ring-primary/30">
                          <AvatarImage src={user.avatar} alt={user.displayName} />
                          <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {user.isLive && (
                          <Badge className="absolute -bottom-1 -right-1 bg-primary animate-pulse-subtle">Live</Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm text-gradient">{user.displayName}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">{user.bio}</p>
                      <Button size="sm" variant="outline" className="w-full cosmic-glow">
                        Follow
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            <motion.div
              className="py-12 text-center cosmic-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-float" />
              <h3 className="text-lg font-medium mb-2 text-gradient">Follow people to see their rooms</h3>
              <p className="text-muted-foreground mb-4">
                When people you follow host or join rooms, they'll appear here
              </p>
              <Button className="cosmic-button">Discover People</Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="space-y-4 pt-2">
              {liveRooms
                .sort((a, b) => b.participants - a.participants)
                .map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <RoomCard room={room} onJoin={() => handleJoinRoom(room.id)} />
                  </motion.div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

