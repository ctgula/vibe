'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Users, Headphones, Mic, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase-client';
import { useAuth } from '@/hooks/use-supabase-auth';

interface Room {
  id: string;
  name: string;
  description: string;
  created_at: string;
  participant_count?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function Directory() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, description, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant count for each room
      const roomsWithParticipants = await Promise.all(
        (data || []).map(async (room: Room) => {
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: "estimated" })
            .eq('room_id', room.id)
            .eq('is_active', true)
            .single();

          return {
            ...room,
            participant_count: count || 0,
          };
        })
      );

      setRooms(roomsWithParticipants);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const subscription = supabase
      .channel('rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!mounted) return null;

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#18181b] to-[#0e7490] text-white p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Active Rooms
            </h1>
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-zinc-400 text-lg">
            Join a room or create your own to start collaborating
          </p>
        </motion.div>

        {/* Create Room Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => router.push('/room/create')}
          className="w-full sm:w-auto mb-8 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 hover:shadow-indigo-500/20 hover:from-indigo-500 hover:to-blue-500 transition-all"
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Plus className="w-5 h-5" />
          Create New Room
          <ArrowRight className="w-5 h-5 ml-1" />
        </motion.button>

        {/* Room Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              variants={container}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  className="h-48 rounded-2xl bg-zinc-900/50 animate-pulse"
                />
              ))}
            </motion.div>
          ) : rooms.length > 0 ? (
            <motion.div
              key="rooms"
              variants={container}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {rooms.map((room: Room) => (
                <motion.div
                  key={room.id}
                  variants={item}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group shadow-lg hover:shadow-indigo-500/10"
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/20">
                      <Headphones className="w-6 h-6 text-indigo-400" />
                    </div>
                    <motion.div 
                      className="flex items-center gap-2 text-zinc-400"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Users className="w-4 h-4" />
                      <span>{room.participant_count}</span>
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-indigo-400 transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-2 group-hover:text-zinc-300 transition-colors">
                    {room.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-full text-center py-12"
            >
              <p className="text-zinc-400 mb-4">No active rooms found</p>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/room/create')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl text-white font-medium shadow-lg hover:shadow-indigo-500/20 hover:from-indigo-500 hover:to-blue-500 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Room
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
