'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/hooks/use-supabase-auth";
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Headphones, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type Room = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_public: boolean;
  created_by: string | null;
  created_by_guest: string | null;
  participant_count: number;
  tags: string[] | null;
  creator_profile: {
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
};

function HomePageContent() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user, authLoading, profile, guestId } = useAuth(); 

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    if (!user && !guestId) {
      console.log("No authenticated user or guest, redirecting to welcome page");
      router.push('/welcome');
    } else {
      console.log("User authenticated:", user ? "Regular user" : "Guest user");
    }
  }, [isClient, user, guestId, router]);

  useEffect(() => {
    if (!isClient) return;

    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select(`
            *,
            creator_profile:profiles!rooms_created_by_fkey (
              username,
              display_name,
              avatar_url
            ),
            room_participants (
              id
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching rooms:', error);
          return;
        }

        // Process rooms data
        const processedRooms = roomsData.map(room => ({
          ...room,
          participant_count: room.room_participants?.length || 0
        }));

        setRooms(processedRooms);
      } catch (err) {
        console.error('Error in fetchRooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [isClient]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading rooms...</p>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Create Room Button */}
        <div className="mb-8">
          <Link href="/create-room">
            <Button size="lg" className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Room
            </Button>
          </Link>
        </div>

        {/* Room List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/room/${room.id}`}>
                  <div className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{room.name}</h3>
                        <p className="text-sm text-zinc-400">{room.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center text-zinc-400">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm">{room.participant_count}</span>
                      </div>
                    </div>
                    
                    {/* Host Info */}
                    {room.creator_profile && (
                      <div className="flex items-center text-sm text-zinc-500">
                        <img 
                          src={room.creator_profile.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${room.created_by}`}
                          alt={room.creator_profile.display_name}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <span>Hosted by {room.creator_profile.display_name}</span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {room.tags && room.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.tags.map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {rooms.length === 0 && !loading && (
          <div className="text-center py-12">
            <Headphones className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Rooms</h3>
            <p className="text-zinc-400 mb-6">Be the first to create a room and start the conversation!</p>
            <Link href="/create-room">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create Your First Room
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return <HomePageContent />;
}
