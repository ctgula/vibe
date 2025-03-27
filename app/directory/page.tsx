'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/transitions/PageTransition";
import { Search, Users, Tag, Clock, ArrowRight } from "lucide-react";

export default function RoomDirectory() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        // Fetch all public rooms
        const { data, error } = await supabase
          .from("rooms")
          .select(`
            id, 
            name, 
            description,
            topics, 
            created_at,
            created_by,
            profiles:created_by(name, avatar_url),
            last_active_at,
            theme
          `)
          .eq("is_active", true)
          .order("last_active_at", { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setRooms(data || []);
        
        // Extract all unique tags for filtering
        const tags = data
          ?.flatMap(room => room.topics || [])
          .filter((tag, index, self) => tag && self.indexOf(tag) === index);
          
        setAllTags(tags || []);
      } catch (err) {
        console.error("Error fetching public rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);

  const joinRoom = async (roomId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/signin"); // Redirect to login if not authenticated
        return;
      }

      // Add the user as a participant if they're not already
      const { data: existingParticipant } = await supabase
        .from("room_participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", userData.user.id)
        .single();

      if (!existingParticipant) {
        await supabase.from("room_participants").insert({
          room_id: roomId,
          user_id: userData.user.id,
          is_speaker: false,
          is_muted: true,
          has_raised_hand: false,
          joined_at: new Date().toISOString()
        });

        // Log the join in activity logs
        await supabase.from("activity_logs").insert({
          room_id: roomId,
          user_id: userData.user.id,
          action: "joined",
          created_at: new Date().toISOString()
        });

        // Notify the room host (if they're not the user joining)
        const { data: room } = await supabase
          .from("rooms")
          .select("created_by")
          .eq("id", roomId)
          .single();
          
        if (room && room.created_by !== userData.user.id) {
          await supabase.from("notifications").insert({
            user_id: room.created_by,
            type: "user_joined",
            content: { 
              message: `${userData.user.user_metadata?.name || 'A user'} joined your room`,
              roomId: roomId
            },
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error("Error joining room:", err);
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-zinc-900 text-white pb-20">
        {/* Header */}
        <div className="bg-gradient-to-b from-indigo-900/30 to-zinc-900/0 backdrop-blur-sm border-b border-white/5 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Room Directory</h1>
            <p className="text-zinc-300 max-w-2xl">
              Discover public rooms and join conversations on topics that interest you.
            </p>
          </div>
        </div>
        
        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Search and filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search rooms by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            {allTags.length > 0 && (
              <div>
                <p className="text-sm text-zinc-400 mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Filter by topics:
                </p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
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
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-xl font-medium text-zinc-300 mb-1">No rooms found</h3>
              <p className="text-zinc-500">
                {searchQuery || selectedTags.length > 0
                  ? "Try adjusting your search or filters"
                  : "There are no active rooms at the moment"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors"
                  style={{
                    background: room.theme?.background ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${room.theme.background})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                      <div className="flex items-center text-xs text-zinc-400">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatTimeAgo(room.last_active_at || room.created_at)}
                      </div>
                    </div>
                    
                    {room.description && (
                      <p className="text-zinc-300 mb-4 line-clamp-2">{room.description}</p>
                    )}
                    
                    <div className="flex justify-between items-end">
                      <div>
                        {room.topics && room.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {room.topics.map((topic: string, index: number) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-700/50 text-zinc-300"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-zinc-400">
                          <span className="mr-2">Created by</span>
                          <span className="font-medium text-zinc-300">
                            {room.profiles?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => joinRoom(room.id)}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        <span>Join</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
