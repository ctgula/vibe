'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useRoomParticipants } from '@/hooks/useRoomParticipants';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types/Room';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ClientHomeProps {
  initialRooms: Room[];
}

export default function ClientHome({ initialRooms }: ClientHomeProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, isLoading: authLoading } = useAuth();
  const { guestId, guestProfile, isLoading: guestLoading } = useGuestSession();
  const { participantCounts, isLoading: participantsLoading } = useRoomParticipants();
  const [isClient, setIsClient] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchRooms = async () => {
      try {
        setIsSubscribing(true);
        
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select(`
            *,
            creator_profile:profiles!rooms_created_by_fkey (
              username,
              display_name,
              avatar_url
            ),
            participants (
              id
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching rooms:', error);
          setError("Unable to load rooms. Please refresh the page.");
          return;
        }

        const processedRooms = roomsData.map(room => ({
          ...room,
          participant_count: room.participants?.length || 0
        }));

        setRooms(processedRooms);
      } catch (err) {
        console.error('Error in fetchRooms:', err);
        setError("Something went wrong. Please refresh the page.");
      } finally {
        setIsSubscribing(false);
      }
    };

    fetchRooms();
  }, [isClient]);

  const handleRoomSubscription = useCallback(async () => {
    if (!isClient) return;
    
    setIsSubscribing(true);
    
    try {
      const channel = supabase
        .channel("rooms")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "rooms" },
          (payload) => {
            const newRoom = payload.new as Room;
            if (newRoom.is_active) {
              setRooms((prev: Room[]) => [newRoom, ...prev]);
              toast.success(`"${newRoom.name}" has been created`);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rooms" },
          (payload) => {
            const updatedRoom = payload.new as Room;
            setRooms((prev: Room[]) =>
              prev.map((room: Room) => (room.id === updatedRoom.id ? updatedRoom : room))
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "rooms" },
          (payload) => {
            setRooms((prev: Room[]) => prev.filter((room: Room) => room.id !== payload.old.id));
          }
        );

      const status = await channel.subscribe();
      
      if (channel) {
        console.log("Successfully subscribed to rooms");
      } else {
        console.error("Error subscribing to rooms:", status);
        setError("Unable to get live updates. Please refresh the page.");
      }
      
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Error setting up subscription:", err);
      setError("Unable to get live updates. Please refresh the page.");
    } finally {
      setIsSubscribing(false);
    }
  }, [isClient]);

  useEffect(() => {
    const cleanup = handleRoomSubscription();
    return () => {
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, [handleRoomSubscription]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 }
    }
  };

  const isLoading = !isClient || authLoading || guestLoading || participantsLoading;

  const handleJoinRoom = (roomId: string) => {
    if (!user && !guestId) {
      sessionStorage.setItem('redirectAfterAuth', `/room/${roomId}`);
      router.push('/auth/login');
      return;
    }
    
    router.push(`/room/${roomId}`);
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 relative">
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-purple-950/15 to-zinc-950/25 backdrop-blur-xl pointer-events-none" />
        <div className="relative">
          <div className="flex justify-between items-center mb-8 backdrop-blur-sm bg-black/50 p-5 rounded-2xl border border-white/10 shadow-xl animate-pulse">
            <div>
              <div className="h-8 w-64 bg-white/10 rounded-lg mb-2"></div>
              <div className="h-5 w-48 bg-white/5 rounded-lg"></div>
            </div>
            <div className="h-10 w-32 bg-white/10 rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="backdrop-blur-md bg-black/50 rounded-2xl border border-white/10 shadow-xl overflow-hidden animate-pulse">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="h-6 w-48 bg-white/10 rounded-lg mb-2"></div>
                      <div className="h-4 w-32 bg-white/5 rounded-lg"></div>
                    </div>
                    <div className="h-6 w-16 bg-white/10 rounded-full"></div>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-lg mb-2"></div>
                  <div className="h-4 w-3/4 bg-white/5 rounded-lg mb-4"></div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-16 bg-white/10 rounded-full"></div>
                      <div className="h-6 w-16 bg-white/10 rounded-full"></div>
                    </div>
                    <div className="h-8 w-24 bg-white/10 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 relative">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-purple-950/15 to-zinc-950/25 backdrop-blur-xl pointer-events-none" />
      
      <motion.div 
        className="relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 backdrop-blur-sm bg-black/50 p-5 rounded-2xl border border-white/10 shadow-xl"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-2">
              Live Conversations
            </h1>
            <p className="text-white/80 text-base sm:text-lg">Join a room or create your own</p>
          </div>
          <Link href="/room/create">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button className="relative overflow-hidden group bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-medium shadow-lg shadow-indigo-500/25 w-full sm:w-auto">
                <span className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
                <PlusIcon className="h-5 w-5 mr-2" />
                New Room
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-white"
          >
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 bg-transparent border-red-500/50 text-white hover:bg-red-500/20"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </motion.div>
        )}

        {isSubscribing && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-white flex items-center"
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <p>Connecting to live updates...</p>
          </motion.div>
        )}

        {rooms.length === 0 ? (
          <motion.div 
            variants={itemVariants}
            className="text-center py-12 backdrop-blur-sm bg-black/50 rounded-2xl border border-white/10"
          >
            <p className="text-white/90 text-xl mb-4">No rooms available</p>
            <p className="text-white/70 mb-6">Create one to get started!</p>
            <Link href="/room/create">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Room
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            <AnimatePresence mode="popLayout">
              {rooms.map((room) => {
                const participantCount =
                  participantCounts.find((count) => count.roomId === room.id)?.participantCount || 0;
                return (
                  <motion.div
                    key={room.id}
                    variants={itemVariants}
                    layout
                    layoutId={room.id}
                    exit={{ 
                      opacity: 0, 
                      y: -10, 
                      scale: 0.98,
                      transition: { duration: 0.15 } 
                    }}
                    className="group relative backdrop-blur-md bg-black/50 rounded-2xl border border-white/10 shadow-xl overflow-hidden hover:border-white/20 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 group-hover:from-indigo-600/15 group-hover:to-purple-600/15 transition-all duration-300" />
                    
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 transition-all duration-300">
                            {room.name}
                          </h2>
                          <motion.p 
                            className="text-sm text-white/80 flex items-center gap-2"
                            initial={false}
                            animate={{ 
                              scale: [1, 1.02, 1],
                              transition: { duration: 0.3 }
                            }}
                            key={participantCount}
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            {participantCount} {participantCount === 1 ? "participant" : "participants"}
                          </motion.p>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-black/50 text-white/80 border border-white/10 shadow-inner">
                          {room.is_public ? "Public" : "Private"}
                        </span>
                      </div>
                      
                      {room.description && (
                        <p className="text-sm text-white/60 mb-4 line-clamp-2 group-hover:text-white/80 transition-colors duration-300">
                          {room.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {room.tags?.slice(0, 2).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-2.5 py-0.5 text-xs rounded-full bg-black/50 text-white/70 border border-white/10 shadow-sm backdrop-blur-sm"
                            >
                              {tag}
                            </span>
                          ))}
                          {room.tags && room.tags.length > 2 && (
                            <span className="text-xs text-white/50">+{room.tags.length - 2}</span>
                          )}
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="bg-indigo-600/90 hover:bg-indigo-700 text-white border-none shadow-lg transition-all duration-300"
                            onClick={() => handleJoinRoom(room.id)}
                          >
                            Join Room
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
