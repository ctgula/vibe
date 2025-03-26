"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Zap, TrendingUp, Users, Calendar, Music, Code, Camera, PenTool, Globe } from "lucide-react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Create a proper DiscoverContent component
function DiscoverContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.2 })
  const router = useRouter()

  // Apply haptic feedback for interactions
  const handleInteraction = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(3) // Very short vibration for iOS-like feedback
    }
  }
  
  const trendingTopics = [
    { id: "1", name: "Music Production", icon: <Music className="h-3 w-3 mr-1" /> },
    { id: "2", name: "Mindfulness", icon: <PenTool className="h-3 w-3 mr-1" /> }, 
    { id: "3", name: "AI Technology", icon: <Code className="h-3 w-3 mr-1" /> },
    { id: "4", name: "Art", icon: <Camera className="h-3 w-3 mr-1" /> }, 
    { id: "5", name: "Gaming", icon: <Users className="h-3 w-3 mr-1" /> }, 
    { id: "6", name: "Crypto", icon: <Globe className="h-3 w-3 mr-1" /> }, 
    { id: "7", name: "Travel", icon: <Globe className="h-3 w-3 mr-1" /> }
  ]
  
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true)
      let query = supabase
        .from('rooms')
        .select('*')
        .eq('is_live', true)
      
      // Apply topic filter if selected
      if (selectedTopic) {
        query = query.contains('topics', [selectedTopic])
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching rooms:', error)
      } else {
        setRooms(data || [])
      }
      setLoading(false)
    }

    fetchRooms()

    // Set up real-time subscription
    const subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rooms' 
        }, 
        (payload) => {
          console.log('Real-time update received:', payload)
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            const newRoom = payload.new
            if (newRoom.is_live) {
              // Apply topic filter if needed
              if (!selectedTopic || (newRoom.topics && newRoom.topics.includes(selectedTopic))) {
                setRooms(prevRooms => [newRoom, ...prevRooms])
                handleInteraction() // Subtle feedback for new room
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRoom = payload.new
            setRooms(prevRooms => 
              prevRooms.map(room => 
                room.id === updatedRoom.id ? updatedRoom : room
              )
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedRoomId = payload.old.id
            setRooms(prevRooms => 
              prevRooms.filter(room => room.id !== deletedRoomId)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [selectedTopic])

  // Handle joining a room
  const handleJoinRoom = async (roomId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login')
        return
      }
      
      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single()
      
      if (existingParticipant) {
        // User is already a participant, just navigate to the room
        console.log('User already in room, navigating...')
        router.push(`/rooms/${roomId}`)
        return
      }
      
      // Add user as a participant
      const { error } = await supabase.from('room_participants').insert({
        room_id: roomId,
        user_id: user.id,
        is_speaker: false,
        has_raised_hand: false,
      })
      
      if (error) {
        console.error('Error joining room:', error)
        if (error.code === '23505') {
          // Unique constraint violation (user already in room)
          router.push(`/rooms/${roomId}`)
        }
      } else {
        // Update room's last_active_at timestamp
        await supabase
          .from('rooms')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', roomId);
          
        // Successfully joined, navigate to room
        console.log('Successfully joined room')
        router.push(`/rooms/${roomId}`)
      }
    } catch (error) {
      console.error('Error in handleJoinRoom:', error)
    }
  }

  // Filter rooms based on search query
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = searchQuery === "" || 
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // iOS-like debounced search
  const debouncedSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }
  
  return (
    <motion.div 
      className="space-y-6"
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {/* Search bar */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/50" />
        </div>
        <Input 
          placeholder="Search vibes, topics, or people" 
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-indigo-500"
          value={searchQuery}
          onChange={debouncedSearch}
        />
      </motion.div>
      
      {/* Trending topics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-indigo-400" />
            Trending Topics
          </h2>
          <Button 
            variant="link" 
            className="text-indigo-400 p-0 h-auto text-sm"
            onClick={handleInteraction}
          >
            See All
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <motion.div
              key={topic.id}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                variant="outline"
                className={`bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full text-sm py-1 h-auto flex items-center ${
                  selectedTopic === topic.name ? "bg-indigo-500/30 border-indigo-500/50" : ""
                }`}
                onClick={() => {
                  handleInteraction();
                  setSelectedTopic(selectedTopic === topic.name ? null : topic.name);
                }}
              >
                {topic.icon}
                {topic.name}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Live rooms */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white flex items-center">
            <Zap className="h-4 w-4 mr-2 text-amber-400" />
            Live Now
          </h2>
          <Button 
            variant="link" 
            className="text-indigo-400 p-0 h-auto text-sm"
            onClick={handleInteraction}
          >
            See All
          </Button>
        </div>
        
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-10"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="w-10 h-10 rounded-full bg-indigo-500/50 backdrop-blur-md"
              />
            </motion.div>
          ) : filteredRooms.length > 0 ? (
            <div className="space-y-3">
              {filteredRooms.map((room, index) => (
                <motion.div 
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1.0] // iOS-like easing
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 transition-all hover:bg-white/10 will-change-transform cursor-pointer relative overflow-hidden"
                >
                  {/* Add subtle hover effect */}
                  <motion.div 
                    className="absolute inset-0 bg-white/5 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-white">{room.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex -space-x-2 mr-2">
                          {Array.from({length: 3}).map((_, i) => (
                            <motion.div 
                              key={i} 
                              className="w-5 h-5 rounded-full bg-indigo-600 ring-2 ring-indigo-900/30 flex items-center justify-center text-[8px] font-bold text-white"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 + (i * 0.05) }}
                            >
                              {String.fromCharCode(65 + i)}
                            </motion.div>
                          ))}
                        </div>
                        <span className="text-xs text-white/60">{room.participants_count || 0} listening</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs text-white/60">Live</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-3 w-full px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium rounded-md hover:shadow-lg hover:shadow-cyan-400/20 border border-cyan-300/20 transition-all text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleInteraction();
                      handleJoinRoom(room.id);
                    }}
                  >
                    Join Room
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 flex flex-col items-center justify-center"
            >
              <Search className="h-10 w-10 text-white/20 mb-2" />
              <p className="text-white/50 text-center">No rooms found matching your search</p>
              <Button 
                variant="link" 
                className="mt-2 text-indigo-400"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopic(null);
                  handleInteraction();
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default function DiscoverPage() {
  return (
    <div className="min-h-screen psychedelic-bg">
      <Navigation />
      <main className="container max-w-md mx-auto pt-16 pb-20 px-4">
        <motion.div 
          className="glass-effect p-6 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
        >
          <motion.h1 
            className="text-2xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Discover
          </motion.h1>
          <DiscoverContent />
        </motion.div>
      </main>
    </div>
  )
}
