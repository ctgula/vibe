'use client';

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/transitions/PageTransition";
import { Search, Users, Tag, Clock, ArrowRight, Plus, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useGuestSession } from "@/hooks/useGuestSession";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/ui/logo";

export default function RoomDirectory() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const { user, guestId } = useAuth();
  const { guestProfile } = useGuestSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // Track if the component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);

  // Detect screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add listener for resize events
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        // Log attempt to fetch rooms to debug
        console.log("Fetching rooms from database...");
        
        // Simplified query to match the current database schema
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq('is_active', true)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching rooms:", error);
          toast({
            title: "Error loading rooms",
            description: "Please try again later",
            variant: "destructive"
          });
          setRooms([]);
          setLoading(false);
          return;
        }
        
        console.log("Rooms fetched:", data?.length || 0, "results");
        
        // Transform the data to a consistent format and fetch creator profiles
        const transformedData = data?.map(room => {
          return {
            ...room,
            name: room.name || `Room ${room.id.substring(0, 8)}`,
            description: room.description || 'Join this room to chat with others!',
            participants_count: 0, // Will be populated later
            is_active: room.is_active !== false // Default to true if not set
          };
        }) || [];
        
        // Set rooms data
        if (isMounted.current) {
          setRooms(transformedData);
          
          // Extract all unique tags from room topics
          const tags = new Set<string>();
          transformedData.forEach(room => {
            if (room.topics && Array.isArray(room.topics)) {
              room.topics.forEach((tag: string) => tags.add(tag));
            }
          });
          setAllTags(Array.from(tags));
        }
      } catch (err) {
        console.error("Error in fetchRooms:", err);
        if (isMounted.current) {
          toast({
            title: "Error loading rooms",
            description: "Please try again later",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchRooms();

    const channel = supabase
      .channel("public-rooms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rooms" },
        (payload) => {
          const newRoom = payload.new as any;
          if (newRoom.is_active) {
            setRooms((prev) => [newRoom, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms" },
        (payload) => {
          const updatedRoom = payload.new as any;
          setRooms((prev) =>
            prev.map((room) =>
              room.id === updatedRoom.id ? updatedRoom : room
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rooms" },
        (payload) => {
          const deletedRoomId = payload.old.id;
          setRooms((prev) => prev.filter((room) => room.id !== deletedRoomId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);

  const handleJoinRoom = async (roomId: string) => {
    if (joiningRoom) return; // Prevent multiple clicks
     
    try {
      setJoiningRoom(roomId);
       
      // Optimistic UI update - navigate immediately for a snappy feel
      router.push(`/rooms/${roomId}`);
       
      // The actual room joining logic will happen in the room page
      // This makes the UI feel faster while the backend processes
       
    } catch (error: any) {
      console.error("Error joining room:", error);
      if (isMounted.current) {
        setJoiningRoom(null);
        toast({
          title: "Error joining room",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      }
    }
  };

  // Filter rooms based on search query and selected tags
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = searchQuery === "" || 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => room.topics && room.topics.includes(tag));
      
    return matchesSearch && matchesTags;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  if (rooms.length === 0 && !loading) {
    return (
      <PageTransition>
        <RequireAuth allowGuest>
          <div className="min-h-screen bg-zinc-900 text-white pt-16 pb-20">
            <div className="max-w-5xl mx-auto px-4">
              <header className="mb-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Room Directory</h1>
                  <Button 
                    onClick={() => router.push('/rooms/create')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Room
                  </Button>
                </div>
              </header>
              
              <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex justify-center mb-6">
                  <Home className="w-16 h-16 text-indigo-500/50" />
                </div>
                <h2 className="text-xl font-semibold mb-3">No Rooms Available</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                  There are no active rooms at the moment. Create a new room to start the conversation!
                </p>
                <Button 
                  onClick={() => router.push('/rooms/create')}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" /> Create Your First Room
                </Button>
              </div>
            </div>
          </div>
        </RequireAuth>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header with Vibe Logo and Home Button */}
        <div className="sticky top-0 z-40 w-full bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800/50 px-4 py-3 flex justify-between items-center">
          <Logo size="md" withText={true} />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Clear any redirection flags to prevent loops
              sessionStorage.removeItem('justLoggedIn');
              router.push('/');
            }}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
        
        <RequireAuth allowGuest={true}>
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {/* Header */}
            <div className="bg-gradient-to-b from-indigo-900/30 to-zinc-900/0 backdrop-blur-sm border-b border-white/5 p-3 sm:p-6">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div className="w-full sm:w-auto">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Room Directory</h1>
                  <p className="text-zinc-300 text-sm sm:text-base max-w-2xl">
                    Discover public rooms and join conversations on topics that interest you.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/rooms/create')}
                  className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Room
                </Button>
              </div>
            </div>
            
            <main className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
              {/* Search and filters */}
              <div className="mb-8 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search rooms by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm sm:text-base placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                {allTags.length > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400 mb-2 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Filter by topics:
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-colors whitespace-nowrap ${
                            selectedTags.includes(tag)
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Rooms list */}
              {loading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-2 sm:mb-3" />
                  <h3 className="text-lg sm:text-xl font-medium text-zinc-300 mb-1">No rooms found</h3>
                  <p className="text-zinc-500 text-sm sm:text-base">
                    {searchQuery || selectedTags.length > 0
                      ? "Try adjusting your search or filters"
                      : "There are no active rooms at the moment"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 pb-16 sm:pb-6">
                  {filteredRooms.map((room) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors sm:cursor-pointer"
                      onClick={() => handleJoinRoom(room.id)}
                      style={{
                        background: room.theme?.background ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${room.theme.background})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="p-3 sm:p-5">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <h3 className="text-base sm:text-xl font-semibold text-white truncate max-w-[75%] sm:max-w-full">{room.name}</h3>
                          <div className="flex items-center text-[10px] sm:text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {formatTimeAgo(room.last_active_at || room.created_at)}
                          </div>
                        </div>
                        
                        {room.description && (
                          <p className="text-zinc-300 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">{room.description}</p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 sm:gap-0">
                          <div className="w-full sm:w-auto">
                            {room.topics && room.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                                {(isSmallScreen ? room.topics.slice(0, 3) : room.topics).map((topic: string, index: number) => (
                                  <span 
                                    key={index} 
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-700/50 text-zinc-300 whitespace-nowrap"
                                  >
                                    #{topic}
                                  </span>
                                ))}
                                {isSmallScreen && room.topics.length > 3 && (
                                  <span 
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-700/50 text-zinc-300"
                                  >
                                    +{room.topics.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center text-xs sm:text-sm text-zinc-400">
                              <span className="mr-2">Created by</span>
                              <span className="font-medium text-zinc-300">
                                {room.created_by_profile?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full sm:w-auto mt-2 sm:mt-0">
                            <button
                              className="flex items-center justify-center sm:justify-start gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors w-full sm:w-auto text-sm"
                            >
                              <span>Join</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </RequireAuth>
      </div>
    </PageTransition>
  );
}
