'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useGuestSession } from "@/hooks/useGuestSession";
import { v4 as uuidv4 } from 'uuid';
import { PageTransition } from '@/components/transitions/PageTransition';

async function createOrGetGuestProfile() {
  let id = localStorage.getItem("guestProfileId");

  if (!id) {
    id = uuidv4();

    const { error } = await supabase.from("profiles").insert({
      id,
      name: `Guest_${id.slice(0, 6)}`,
      is_guest: true,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("❌ Failed to create guest profile", error);
      return null;
    }

    localStorage.setItem("guestProfileId", id);
  }

  return id;
}

export default function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [enableVideo, setEnableVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { guestId, loading } = useGuestSession();

  // Add debug logging for component mount
  useEffect(() => {
    console.log('CreateRoom mounted - Guest ID:', guestId, 'Loading:', loading);
  }, [guestId, loading]);

  const particlesInit = async (engine: any) => {
    await loadSlim(engine);
  };

  const suggestedTopics = [
    'Technology',
    'Business',
    'Music',
    'Art',
    'Science',
    'Health',
    'Education',
    'Entertainment',
    'Sports',
  ];

  const handleTopicToggle = (topic: string) => {
    if (topics.includes(topic)) {
      setTopics(topics.filter((t) => t !== topic));
    } else {
      setTopics([...topics, topic]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('Creating room with guest ID:', guestId);

    try {
      const guestId = await createOrGetGuestProfile();

      if (!guestId) {
        console.error('❌ No guest profile ID available');
        toast.error('Failed to create room: No guest profile ID');
        return;
      }

      console.log('🔍 Creating room with guest profile ID:', guestId);

      // 1. Create the Room
      const roomId = uuidv4();
      const { error: roomError } = await supabase.from("rooms").insert({
        id: roomId,
        room_name: roomName || "My Room",
        created_by: guestId,
        is_live: true,
        enable_video: enableVideo,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      });

      if (roomError) {
        console.error("❌ Failed to create room:", roomError);
        toast.error('Failed to create room');
        return;
      }

      console.log('✅ Room created successfully!');

      // 2. Insert as speaker + host in room_participants
      const { error: participantError } = await supabase.from("room_participants").insert({
        room_id: roomId,
        user_id: guestId,
        is_speaker: true,
        is_host: true,
        has_raised_hand: false,
        is_muted: false,
        joined_at: new Date().toISOString()
      });

      if (participantError) {
        console.error("❌ Failed to add host to room participants:", participantError);
        toast.error('Failed to join room');
        return;
      }

      console.log('✅ Added creator as host participant');
      toast.success('Room created successfully!');
      
      // Navigate to room
      router.push(`/room/${roomId}`);

    } catch (err) {
      console.error('❌ Error in handleSubmit:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen psychedelic-bg flex items-center justify-center">
        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-lg p-8 max-w-md w-full mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center">
            <motion.div 
              className="inline-block w-8 h-8 border-4 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h2 className="mt-4 text-xl font-semibold text-white">Setting up your guest session...</h2>
            <p className="mt-2 text-white/80">This will only take a moment</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!guestId) {
    return (
      <div className="min-h-screen psychedelic-bg flex items-center justify-center">
        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-lg p-8 max-w-md w-full mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Failed to Create Guest Session</h2>
            <p className="mt-2 text-white/80">Please try refreshing the page</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-blue-900 text-white relative overflow-hidden">
        {/* Background Particles */}
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: {
              color: {
                value: "transparent",
              },
            },
            fpsLimit: 60,
            particles: {
              color: {
                value: "#ffffff",
              },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: true,
                speed: 0.5,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 40,
              },
              opacity: {
                value: 0.3,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 3 },
              },
            },
            detectRetina: true,
          }}
        />
        {/* Header with Back Button */}
        <div className="relative z-10 p-4 flex items-center">
          <Link href="/" className="text-white hover:text-cyan-400 transition-colors mr-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </motion.div>
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-cyan-400"
          >
            Create Room
          </motion.h1>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-md mb-6"
          >
            {error}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-black/40 backdrop-blur-md rounded-xl border border-gray-800 p-6 mb-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Room Name*</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My Awesome Room"
                className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this room about?"
                className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[100px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Topics</label>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((topic) => (
                  <motion.button
                    key={topic}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      topics.includes(topic)
                        ? 'bg-cyan-400 text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } transition-colors`}
                  >
                    {topic}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300">Public Room</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableVideo}
                    onChange={() => setEnableVideo(!enableVideo)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300">Enable Video</span>
                </label>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(56, 189, 248, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium rounded-md hover:opacity-90 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-t-2 border-r-2 border-black rounded-full animate-spin"></div>
              ) : (
                <>
                  Create Room 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}
