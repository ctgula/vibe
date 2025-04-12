'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, User, LogOut, Camera, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/auth';

// Define room type for better type safety
type RoomType = {
  id: string;
  room_name: string;
  is_live: boolean;
  enable_video: boolean;
  created_by?: string;
  participants?: Array<{count: number}>;
  participant_count?: number;
};

// Define the structure of the joined rooms data from Supabase
type JoinedRoomItem = {
  room: RoomType;
};

export function Profile() {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [createdRooms, setCreatedRooms] = useState<RoomType[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<RoomType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, guestId, isGuest, profile } = useAuth();

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        
        // Handle both authenticated users and guests
        const currentUserId = user?.id || guestId;
        
        if (!currentUserId) {
          toast.error('Please sign in or continue as guest to view your profile');
          router.push('/');
          return;
        }
        
        setUserId(currentUserId);

        // For authenticated users, fetch profile from profiles table
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', currentUserId)
            .single();
            
          if (error) {
            console.error(error);
            toast.error('Could not load profile data');
          } else if (data) {
            setDisplayName(data.display_name || '');
            setAvatarUrl(data.avatar_url || '');
          }
        } else if (isGuest) {
          // For guests, set default values or fetch from guest profiles if applicable
          setDisplayName('Guest User');
          setAvatarUrl(`https://api.dicebear.com/6.x/avataaars/svg?seed=${guestId}`);
        }
        
        // Fetch rooms created by user or guest
        const { data: createdRoomsData, error: createdRoomsError } = await supabase
          .from('rooms')
          .select(`
            id,
            room_name,
            is_live,
            enable_video,
            participants:room_participants(count)
          `)
          .or(`created_by.eq.${user?.id || null},created_by_guest.eq.${guestId || null}`);
          
        if (createdRoomsError) {
          console.error('Error fetching created rooms:', createdRoomsError);
        } else {
          // Process rooms data to include participant count
          const processedRooms = createdRoomsData.map(room => ({
            ...room,
            participant_count: room.participants?.[0]?.count || 0
          }));
          setCreatedRooms(processedRooms);
        }
        
        // Fetch rooms the user or guest has joined
        const { data: joinedRoomsData, error: joinedRoomsError } = await supabase
          .from('room_participants')
          .select(`
            room:rooms (
              id,
              room_name,
              is_live,
              enable_video,
              participants:room_participants(count)
            )
          `)
          .or(`user_id.eq.${user?.id || null},guest_id.eq.${guestId || null}`);
          
        if (joinedRoomsError) {
          console.error('Error fetching joined rooms:', joinedRoomsError);
        } else {
          // Process and filter out rooms created by the user (to avoid duplication)
          const joined = joinedRoomsData
            .map(item => {
              // Use unknown as an intermediate type for safer type assertion
              return item.room ? (item.room as unknown as RoomType) : null;
            })
            .filter((room): room is RoomType => 
              !!room && !!room.id && !!room.room_name && 
              (user ? room.created_by !== user.id : true) // For guests, don't filter
            )
            .map(room => ({
              ...room,
              participant_count: room.participants?.[0]?.count || 0
            }));
          setJoinedRooms(joined);
        }
        
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Something went wrong loading your profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isClient) {
      fetchProfile();
    }
  }, [router, user, guestId, isGuest, isClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // Apply haptic feedback if available
      if (isClient && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(5);
      }
      
      const saveToast = toast.loading('Saving your profile...');

      // Only authenticated users can save profile changes
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: userId, display_name: displayName, avatar_url: avatarUrl });
          
        if (error) {
          setError(error.message);
          toast.dismiss(saveToast);
          toast.error(`Failed to save: ${error.message}`);
        } else {
          setSaveSuccess(true);
          setIsEditing(false);
          toast.dismiss(saveToast);
          toast.success('Profile updated successfully!');
          
          // Reset success message after 2 seconds
          setTimeout(() => {
            setSaveSuccess(false);
          }, 2000);
        }
      } else {
        // For guests, just show a message that they need to sign up
        toast.dismiss(saveToast);
        toast.error('Create an account to save profile changes');
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    // Apply haptic feedback if available
    if (isClient && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    const logoutToast = toast.loading(isGuest ? 'Exiting guest mode...' : 'Signing out...');
    
    try {
      await supabase.auth.signOut();
      
      // Clear guest session if applicable
      if (isGuest && isClient) {
        localStorage.removeItem('guestId');
        localStorage.removeItem('guestProfileId');
      }
      
      toast.dismiss(logoutToast);
      toast.success(isGuest ? 'Exited guest mode' : 'Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.dismiss(logoutToast);
      toast.error('Failed to sign out');
      console.error('Logout error:', error);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    
    // Focus the input field when entering edit mode
    if (!isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    
    // Apply haptic feedback if available
    if (isClient && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(3);
    }
  };
  
  const handleJoinRoom = async (roomId: string) => {
    const joinToast = toast.loading('Joining room...');
    
    try {
      router.push(`/room/${roomId}`);
      toast.dismiss(joinToast);
    } catch (err) {
      toast.dismiss(joinToast);
      toast.error('Failed to join room');
      console.error('Join room error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 1, ease: "linear" },
            scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
          className="w-12 h-12 mb-4"
        >
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-sm text-cyan-400/80"
        >
          Loading your profile...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-cyan-400">Your Profile</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={toggleEditMode}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {isEditing ? (
            <X className="w-5 h-5" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </motion.button>
      </motion.div>

      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="relative"
        >
          <Avatar className="h-24 w-24 border-2 border-white/20 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-blue-500/20 rounded-full backdrop-blur-sm"></div>
            <AvatarImage 
              src={avatarUrl || "/placeholder-avatar.png"} 
              alt={displayName || "User"} 
              className="object-cover scale-[1.01]"
              style={{ 
                imageRendering: 'auto' as const,
                transform: 'translateZ(0)'
              }}
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600">
              <User className="w-10 h-10 text-white" />
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 right-0 bg-cyan-400 rounded-full h-8 w-8 flex items-center justify-center shadow-lg border-2 border-white"
            >
              <Camera className="h-4 w-4 text-black" />
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.form
              key="edit-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="w-full space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Display Name</label>
                <Input
                  ref={inputRef}
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Avatar URL</label>
                <Input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-2"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90 transition-opacity"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Save
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="display-info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <motion.h2 
                className="text-lg font-semibold text-white"
                animate={saveSuccess ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {displayName || "Anonymous User"}
              </motion.h2>
              <motion.p 
                className="text-sm text-gray-300 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                User ID: {userId?.substring(0, 8)}...
              </motion.p>
              
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center text-green-400 text-sm mt-2"
                >
                  <Check className="h-4 w-4 mr-1" /> Profile updated
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="pt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Your Rooms</h3>
            {createdRooms.length === 0 ? (
              <p className="text-gray-400 text-sm">You haven't created any rooms yet.</p>
            ) : (
              <div className="space-y-3">
                {createdRooms.map(room => (
                  <motion.div 
                    key={room.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-black/30 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{room.room_name}</h4>
                        <div className="flex items-center mt-1 gap-2">
                          {room.is_live && (
                            <span className="flex items-center text-red-400 text-xs">
                              <motion.span 
                                animate={{ opacity: [0.5, 1, 0.5] }} 
                                transition={{ duration: 2, repeat: Infinity }} 
                                className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1"
                              ></motion.span>
                              Live
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">
                            {room.participant_count} listening
                          </span>
                          {room.enable_video && (
                            <span className="text-blue-400 text-xs">Video</span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleJoinRoom(room.id)}
                        className="text-xs px-2 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded"
                      >
                        Join
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Rooms You've Joined</h3>
            {joinedRooms.length === 0 ? (
              <p className="text-gray-400 text-sm">You haven't joined any rooms yet.</p>
            ) : (
              <div className="space-y-3">
                {joinedRooms.map(room => (
                  <motion.div 
                    key={room.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-black/30 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{room.room_name}</h4>
                        <div className="flex items-center mt-1 gap-2">
                          {room.is_live && (
                            <span className="flex items-center text-red-400 text-xs">
                              <motion.span 
                                animate={{ opacity: [0.5, 1, 0.5] }} 
                                transition={{ duration: 2, repeat: Infinity }} 
                                className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1"
                              ></motion.span>
                              Live
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">
                            {room.participant_count} listening
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleJoinRoom(room.id)}
                        className="text-xs px-2 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded"
                      >
                        Join
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="pt-6"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {isGuest ? 'Guest Profile' : 'My Profile'}
          </h1>
          <p className="text-zinc-400">
            {isGuest 
              ? 'You\'re browsing as a guest. Create an account to save your profile and rooms.' 
              : 'Manage your profile and see your activity.'}
          </p>
          
          {isGuest && (
            <div className="mt-4">
              <Button
                onClick={() => router.push('/auth/signup')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create Account
              </Button>
            </div>
          )}
        </div>
        <Button 
          variant="destructive" 
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
        </Button>
      </motion.div>
    </div>
  );
}
