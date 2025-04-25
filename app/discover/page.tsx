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
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.2 })
  const router = useRouter()

  // Apply haptic feedback for interactions
  const handleInteraction = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(3) // Very short vibration for iOS-like feedback
    }
  }
  
  // Detect screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }
    
    // Initial check
    checkScreenSize()
    
    // Add listener for resize events
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])
  
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
      try {
        // Completely reengineered query to ensure compatibility with current schema
        let query = supabase
          .from('rooms')
          .select(`
            id, 
            created_at,
            created_by,
            name,
            title,
            description,
            theme,
            topics,
            last_active_at,
            is_active
          `)
          .order('last_active_at', { ascending: false })
          .limit(50)
       
        // Apply topic filter if selected
        if (selectedTopic) {
          query = query.contains('topics', [selectedTopic])
        }
        
        // Execute the query
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching rooms:', error)
          setRooms([])
          setLoading(false)
          return
        }
        
        // Transform the raw data to ensure consistency
        const transformedRooms = data.map(room => {
          // Create a consistent room structure regardless of what fields exist in the DB
          const roomName = room.name || room.title || `Room ${room.id.substring(0, 4)}`;
          const roomDescription = room.description || 'Join this room to chat with others!';
          
          return {
            ...room,
            id: room.id,
            name: roomName,
            title: roomName,
            description: roomDescription,
            is_live: room.is_active !== false, // Use is_active as a proxy for is_live
            created_at: room.created_at,
            last_active_at: room.last_active_at || room.created_at,
            topics: room.topics || [],
            participants_count: 0, // Will be populated in the next step
            theme: room.theme || { color: 'default' }
          };
        });
        
        // Get participant counts in a simpler way
        if (transformedRooms.length > 0) {
          try {
            // Get all room IDs
            const roomIds = transformedRooms.map(room => room.id);
            
            // Fetch all participants for these rooms in a single query
            const { data: rawParticipantData, error: participantError } = await supabase
              .from('room_participants')
              .select('room_id')
              .in('room_id', roomIds);
            
            if (!participantError && rawParticipantData) {
              // Process the data client-side to count participants per room
              const participantData = rawParticipantData.reduce((acc, { room_id }) => {
                acc[room_id] = (acc[room_id] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              // Update the room objects with participant counts
              transformedRooms.forEach(room => {
                room.participants_count = participantData[room.id] || 0;
              });
            }
          } catch (err) {
            console.error('Error fetching participant counts:', err);
            // Continue with default participant counts of 0
          }
        }
        
        setRooms(transformedRooms)
      } catch (err) {
        console.error('Error in fetchRooms:', err);
      } finally {
        setLoading(false)
      }
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
        // @ts-ignore - Next.js types are not fully compatible with the router
        router.push('/auth/signin')
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
            <div className="space-y-3 pb-16 md:pb-0">
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
                  className="bg-white/5 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/10 transition-all hover:bg-white/10 will-change-transform cursor-pointer relative overflow-hidden"
                  onClick={() => handleJoinRoom(room.id)}
                >
                  {/* Add subtle hover effect */}
                  <motion.div 
                    className="absolute inset-0 bg-white/5 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="w-full sm:w-auto">
                      <h3 className="font-medium text-white text-base sm:text-lg truncate">{room.name}</h3>
                      <div className="flex items-center mt-1 flex-wrap">
                        <div className="flex -space-x-2 mr-2 mb-1 sm:mb-0">
                          {Array.from({length: 3}).map((_, i) => (
                            <motion.div 
                              key={i} 
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 border border-white/20"
                            />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-white/60">
                          {room.participants_count || 0} listening
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 w-full sm:w-auto flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {room.topics && room.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                      {(isSmallScreen ? room.topics.slice(0, 3) : room.topics).map((topic: string, i: number) => (
                        <span key={i} className="text-xs bg-white/5 text-white/70 px-2 py-0.5 rounded-full text-[10px] sm:text-xs whitespace-nowrap">
                          #{topic}
                        </span>
                      ))}
                      {isSmallScreen && room.topics.length > 3 && (
                        <span className="text-xs bg-white/5 text-white/70 px-2 py-0.5 rounded-full text-[10px]">
                          +{room.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-10 px-2 sm:px-4"
            >
              <motion.div
                className="inline-block mb-4 p-4 bg-white/5 rounded-full"
              >
                <Users className="h-6 w-6 sm:h-10 sm:w-10 text-white/30" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-medium text-white mb-2">No rooms found</h3>
              <p className="text-white/60">
                {searchQuery || selectedTopic 
                  ? "Try adjusting your search or filters" 
                  : "Be the first to create a room"}
              </p>
              <Button 
                onClick={() => router.push('/rooms/create')} 
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Create a Room
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
    <div className="min-h-screen bg-zinc-900 relative overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-900/80 to-zinc-900 z-0" />
      </div>
      <Navigation />
      <main className="relative z-10 max-w-xl mx-auto pt-20 px-3 sm:px-4 pb-20">
        <DiscoverContent />
      </main>
    </div>
  )
}
