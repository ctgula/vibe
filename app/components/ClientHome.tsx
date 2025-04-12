'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch rooms when client is ready
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

  // Set up realtime subscription
  useEffect(() => {
    if (!isClient) return;

    // Setup Supabase realtime subscription
    const setupSubscription = () => {
      try {
        const channel = supabase.channel('public:rooms');
        
        // Handle room inserts
        channel.on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'rooms' 
          },
          (payload) => {
            const newRoom = payload.new as Room;
            if (newRoom.is_active) {
              setRooms((prev) => [newRoom, ...prev]);
              toast.success(`"${newRoom.name}" has been created`);
            }
          }
        );
        
        // Handle room updates
        channel.on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'rooms' 
          },
          (payload) => {
            const updatedRoom = payload.new as Room;
            setRooms((prev) => 
              prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
            );
          }
        );
        
        // Handle room deletions
        channel.on(
          'postgres_changes',
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'rooms' 
          },
          (payload) => {
            setRooms((prev) => 
              prev.filter((room) => room.id !== payload.old.id)
            );
          }
        );
        
        // Subscribe to the channel
        channel.subscribe();
        console.log('Subscribed to room changes');
        
        // Store channel reference for cleanup
        channelRef.current = channel;
      } catch (err) {
        console.error('Error setting up subscription:', err);
        setError('Unable to get live updates. Please refresh the page.');
      }
    };
    
    setupSubscription();
    
    // Cleanup function for subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('Unsubscribed from room changes');
      }
    };
  }, [isClient]);

  const handleJoinRoom = (roomId: string) => {
    if (!user && !guestId) {
      sessionStorage.setItem('redirectAfterAuth', `/room/${roomId}`);
      router.push('/auth/login');
      return;
    }
    
    router.push(`/room/${roomId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const isLoading = !isClient || authLoading || guestLoading || participantsLoading;

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 relative">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-400">Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 relative">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-6 text-red-500">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Available Rooms</h1>
        <Link href="/room/create" className="inline-block">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-purple-500/20">
            <PlusIcon className="h-5 w-5" />
            <span>Create Room</span>
          </Button>
        </Link>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative z-10"
      >
        {rooms.length === 0 ? (
          <div className="bg-zinc-900/80 backdrop-blur-lg border border-zinc-800/50 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6">
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </motion.svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Rooms Available</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Be the first to create a room and start the conversation!
            </p>
            <Link href="/room/create" className="inline-block">
              <Button variant="secondary" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Your First Room
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {rooms.map((room) => {
                const participantCount = participantCounts.find(
                  count => count.roomId === room.id
                )?.participantCount || room.participant_count || 0;
                
                return (
                  <motion.div
                    key={room.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, y: 20 }}
                    layout={!prefersReducedMotion}
                    transition={{
                      layout: { duration: 0.3, ease: "easeOut" },
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
