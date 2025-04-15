'use client';

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/transitions/PageTransition";
import { Search, Users, Tag, Clock, ArrowRight, Plus, Home, Sparkles } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/components/ui/use-toast";

export default function RoomDirectory() {
  return (
    <ProtectedRoute>
      <DirectoryContent />
    </ProtectedRoute>
  );
}

function DirectoryContent() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const { user, guestId, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Track if the component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);

  // Log auth state for debugging
  useEffect(() => {
    console.log('Directory page auth state:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      guestId, 
      profile: profile ? { id: profile.id, is_guest: profile.is_guest } : null,
      loading: authLoading
    });
  }, [user, guestId, profile, authLoading]);

  // Detect screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        if (!isMounted.current) return;
        
        // Log user/guest state before query
        if (!user && !guestId) {
          console.error("No user or guest ID available for query in fetchRooms");
          // Don't return early - continue with query to see what happens
        }
        
        // Fetch rooms from Supabase
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            profiles:created_by(username, avatar_url),
            room_participants:room_participants(id, profile_id, joined_at)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Supabase error in fetchRooms:", error);
          toast({
            title: "Error",
            description: "Could not load rooms. Please try again later.",
            variant: "destructive"
          });
          return;
        }
        
        if (!isMounted.current) return;
        
        // Process rooms data
        const processedRooms = data.map(room => {
          // Extract topics from room data
          const topics = room.topics || [];
          
          // Count participants
          const participantsCount = room.room_participants ? room.room_participants.length : 0;
          
          return {
            ...room,
            topics,
            participants_count: participantsCount
          };
        });
        
        setRooms(processedRooms);
        
        // Extract all unique tags for filtering
        const allTopics = Array.from(new Set(
          processedRooms.flatMap(room => room.topics || [])
        ));
        
        setAllTags(allTopics);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        if (isMounted.current) {
          toast({
            title: "Error",
            description: "Failed to load rooms. Please try again.",
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
  }, [supabase, toast, user, guestId]);

  // Realtime updates
  useEffect(() => {
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
  }, [supabase]);

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
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] px-4 py-safe-top pb-safe-bottom relative overflow-hidden">
        {/* Animated background blobs */}
        <motion.div className="absolute -top-40 -left-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl animate-pulse z-0" animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }} />
        <motion.div className="absolute -bottom-40 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse z-0" animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }} />
        <main className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-4 md:p-8 mt-6 mb-10 md:mt-14 md:mb-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-300 drop-shadow-lg flex items-center gap-2 mb-1">
                Directory <Sparkles className="inline w-6 h-6 text-pink-400 animate-pulse" />
              </h1>
              <p className="text-zinc-200 text-lg">Browse and join live rooms.</p>
            </div>
            <Button className="bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white py-3 px-6 rounded-xl shadow-lg font-semibold">
              <Plus className="w-5 h-5 mr-2" /> Create Room
            </Button>
          </div>
          {/* Search and tags */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 flex items-center bg-zinc-900/70 border border-zinc-700/50 rounded-xl px-4 py-3">
              <Search className="w-5 h-5 text-zinc-400 mr-3" />
              <input
                type="text"
                className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-lg"
                placeholder="Search rooms or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 md:ml-4">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border-2 ${selectedTags.includes(tag) ? 'bg-sky-500 text-white border-sky-400 shadow' : 'bg-zinc-800/60 text-zinc-300 border-transparent hover:bg-sky-700/30 hover:text-white'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Room cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="col-span-full text-center text-zinc-400 py-16">No rooms found. Try creating one!</div>
            ) : (
              rooms.map((room, idx) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                  className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/40 rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all group hover:shadow-2xl hover:border-sky-400"
                  onClick={() => handleJoinRoom(room.id)}
                >
                  {/* Animated color bar */}
                  <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-sky-400 via-indigo-400 to-cyan-300 group-hover:from-pink-400 group-hover:to-indigo-400 transition-all" />
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-white truncate max-w-[75%]">{room.name}</h3>
                      <div className="flex items-center text-xs text-zinc-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimeAgo(room.last_active_at || room.created_at)}
                      </div>
                    </div>
                    {room.description && (
                      <p className="text-zinc-300 mb-3 line-clamp-2 text-base">{room.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {room.topics && room.topics.length > 0 && (
                        room.topics.slice(0, 3).map((topic: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-800/50 text-sky-200"
                          >
                            #{topic}
                          </span>
                        ))
                      )}
                      {room.topics && room.topics.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-700/60 text-zinc-300">
                          +{room.topics.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-xs text-zinc-400">
                        <Users className="w-4 h-4 mr-1" />
                        {room.participants_count || 0} online
                      </div>
                      <Button className="bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-sky-500 text-white py-2 px-4 rounded-lg shadow font-semibold">
                        Join <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
