'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSimpleAuth } from "@/contexts/SimpleAuthProvider";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";

export default function SimpleDirectoryPage() {
  const { user, guestId, loading, isAuthenticated, profile } = useSimpleAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log("Simple Directory Auth State:", {
      user: user ? { id: user.id, email: user.email } : null,
      guestId,
      profile: profile ? { id: profile.id, username: profile.username } : null,
      isAuthenticated,
      loading
    });
  }, [user, guestId, profile, isAuthenticated, loading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to onboarding");
      router.push("/onboarding");
    }
  }, [isAuthenticated, loading, router]);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log("Fetching rooms...");
        const { data, error } = await supabase
          .from('rooms')
          .select('*, profiles:created_by(username, avatar_url)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error("Error fetching rooms:", error);
          return;
        }
        
        console.log(`Found ${data.length} rooms`);
        setRooms(data);
      } catch (err) {
        console.error("Unexpected error fetching rooms:", err);
      } finally {
        setRoomsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div>Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Directory</h1>
          <p className="text-zinc-400">
            {user ? `Welcome, ${user.email}` : `Welcome, Guest (${guestId?.substring(0, 8)})`}
          </p>
          {profile && (
            <p className="text-zinc-300">
              Profile: {profile.username || 'No username set'}
            </p>
          )}
        </header>

        {roomsLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.length === 0 ? (
              <div className="col-span-full text-center py-10 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-zinc-400">No rooms available. Create one!</p>
                <button 
                  onClick={() => router.push('/rooms/create')}
                  className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-white"
                >
                  Create Room
                </button>
              </div>
            ) : (
              rooms.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-zinc-900/70 rounded-xl p-4 border border-zinc-800 hover:border-indigo-500/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/rooms/${room.id}`)}
                >
                  <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
                  {room.description && (
                    <p className="text-zinc-400 mb-4 line-clamp-2">{room.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-zinc-500 text-sm">
                      <Users className="w-4 h-4 mr-1" />
                      {room.participant_count || 0} online
                    </div>
                    <div className="text-indigo-400 flex items-center text-sm font-medium">
                      Join <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
