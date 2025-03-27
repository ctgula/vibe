'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useClickAway } from 'react-use';
import { useRef } from 'react';
import crypto from 'crypto';
import { generateCreativeGuestName, generateAvatarUrl } from '@/lib/utils';

export default function Home() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useState<any>({
    username: 'Guest',
    email: 'guest@example.com',
    avatar_url: null,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useClickAway(dropdownRef, () => {
    setShowDropdown(false);
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        // Calculate timestamp for 2 minutes ago
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        
        // Fetch rooms active in the last 2 minutes
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            room_participants:room_participants(count),
            profiles:profiles(name, avatar_url)
          `)
          .gt('last_active_at', twoMinutesAgo)
          .order('last_active_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching rooms:', error);
          setError('Failed to load rooms. Please try again.');
          return;
        }
        
        // Format room data with participant count
        const formattedRooms = data.map(room => ({
          ...room,
          participants_count: room.room_participants[0]?.count || 0,
          host_name: room.profiles?.name || 'Unknown Host',
          host_avatar: room.profiles?.avatar_url || null
        }));
        
        setRooms(formattedRooms);
      } catch (err) {
        console.error('Error in fetchRooms:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    
    // Set up a real-time subscription for room updates
    const roomsSubscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          console.log('Room update:', payload);
          // Refetch rooms to apply the 2-minute filter on real-time updates
          fetchRooms();
        }
      )
      .subscribe();
      
    // Refresh rooms every 30 seconds to keep the list current with the 2-minute filter
    const intervalId = setInterval(fetchRooms, 30000);
    
    return () => {
      clearInterval(intervalId);
      roomsSubscription.unsubscribe();
    };
  }, []);

  const handleJoinRoom = async (roomId: string) => {
    try {
      setJoiningRoom(roomId);
      
      // 1. Get or create guest profile
      let guestProfileId = localStorage.getItem('guestProfileId');
      
      if (!guestProfileId) {
        // Create a new guest profile
        const guestId = crypto.randomUUID();
        const guestName = generateCreativeGuestName();
        
        // Generate a random avatar
        const avatarUrl = generateAvatarUrl(guestId);
        
        // Create profile in database
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: guestId,
            name: guestName,
            display_name: guestName,
            is_guest: true,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Save to localStorage
        localStorage.setItem('guestProfileId', guestId);
        guestProfileId = guestId;
        console.log('✅ Created new guest profile:', guestId);
      } else {
        console.log('✅ Using existing guest profile:', guestProfileId);
      }
      
      // 2. Join the room as a listener
      const { error: joinError } = await supabase
        .from('room_participants')
        .upsert(
          {
            room_id: roomId,
            user_id: guestProfileId,
            is_speaker: false,
            is_muted: true,
            has_raised_hand: false,
            joined_at: new Date().toISOString()
          },
          { onConflict: 'room_id,user_id', ignoreDuplicates: false }
        );
        
      if (joinError) {
        console.error('Error joining room:', joinError);
        throw joinError;
      }
      
      console.log('✅ Joined room successfully');
      
      // 3. Update room activity
      await supabase
        .from('rooms')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', roomId);
      
      // 4. Navigate to room page
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setJoiningRoom(null);
      setError('Failed to join room. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-blue-900 text-white">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-md z-50 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Vibe
          </Link>
          <motion.div 
            className="relative" 
            ref={dropdownRef}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 hover:bg-white/10 transition-all border border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <span className="text-gray-200">{user.username}</span>
            </button>
          </motion.div>
        </div>
      </motion.header>

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Live Rooms</h1>
            <p className="text-gray-400 mt-1">Join a room or create your own</p>
          </div>
          <Link
            href="/create-room"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30"
          >
            Create Room
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        ) : rooms.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.5 }
            }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 5,
                ease: "easeInOut" 
              }}
              className="text-6xl mb-6 inline-block"
            >
              🌀
            </motion.div>
            <h2 className="text-xl font-semibold mb-2">No vibes yet. Start one!</h2>
            <p className="text-gray-400 mb-8">Create a room to get started!</p>
            <Link
              href="/create-room"
              className="inline-flex items-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              Create Your First Room
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {rooms
                .filter(room => room.participants_count > 0) // Only show active rooms with participants
                .map((room, index) => (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      duration: 0.4,
                      delay: index * 0.1 // Staggered animation
                    }
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="group relative overflow-hidden bg-black/30 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-cyan-500/10"
                >
                  {/* Glass effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-xl" />
                  
                  <h2 className="relative text-xl font-semibold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                    {room.room_name}
                  </h2>
                  <p className="relative text-gray-400 mb-4 line-clamp-2">{room.description || "Join this room to start vibing!"}</p>
                  
                  {/* Topics */}
                  {room.topics && room.topics.length > 0 && (
                    <div className="relative flex flex-wrap gap-2 mb-4">
                      {room.topics.map((topic: string, i: number) => (
                        <span 
                          key={i} 
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      {room.participants_count} listening
                    </span>
                    <motion.button
                      onClick={() => handleJoinRoom(room.id)}
                      className={`bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 ${joiningRoom === room.id ? 'opacity-80 pointer-events-none' : ''}`}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 0 15px rgba(6, 182, 212, 0.5)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      disabled={joiningRoom === room.id}
                    >
                      {joiningRoom === room.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </span>
                      ) : (
                        'Join Room'
                      )}
                    </motion.button>
                  </div>
                  {room.enable_video && (
                    <motion.div 
                      initial={{ opacity: 0.8 }}
                      animate={{ 
                        opacity: [0.8, 1, 0.8],
                        scale: [1, 1.03, 1]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "easeInOut"
                      }}
                      className="absolute top-4 right-4 bg-purple-500/20 px-2 py-0.5 rounded text-xs font-medium text-purple-200 border border-purple-500/30 backdrop-blur-sm"
                    >
                      Video Enabled
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
