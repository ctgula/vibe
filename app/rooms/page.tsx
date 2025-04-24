'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Home, Mic, Settings, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRooms } from '@/hooks/use-rooms';
import { UserProfileLink } from '@/components/user-profile-link';

// Define the Room interface to fix TypeScript errors
interface Room {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active?: boolean;
  // Add other properties as needed
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, description: string) => Promise<void>;
}

function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error('Room name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateRoom(roomName, roomDescription);
      setRoomName('');
      setRoomDescription('');
      onClose();
    } catch (err) {
      console.error('Error creating room:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create a New Room</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-zinc-400 mb-1">
                  Room Name *
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="roomDescription" className="block text-sm font-medium text-zinc-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="roomDescription"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="What's this room about?"
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !roomName.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} className="mr-2" />
                    Create Room
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const { user, profile, isLoading: authLoading, createEmptyProfile } = useAuth();
  const { rooms, isLoading: roomsLoading, error, fetchRooms, createRoom, joinRoom } = useRooms();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    if (!authLoading && !user) {
      // If no authenticated user, redirect to home to allow guest access choice
      console.log('No user found, redirecting to home');
      toast.error('Please sign in or continue as guest');
      window.location.href = '/';
    }
  }, [user, authLoading]);

  // Create profile if missing
  useEffect(() => {
    async function ensureProfile() {
      if (!user) return;
      
      try {
        console.log('Checking profile for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking profile:', error);
        } else if (!data) {
          console.log('No profile found, creating one');
          
          // Use the createEmptyProfile function from useAuth context
          if (createEmptyProfile) {
            await createEmptyProfile(user.id);
            console.log('Profile created successfully via createEmptyProfile');
          } else {
            // Fallback to direct creation if createEmptyProfile is not available
            console.error('createEmptyProfile not available');
            toast.error('Error creating profile');
          }
        } else {
          console.log('Profile exists:', data);
        }
      } catch (err) {
        console.error('Exception checking profile:', err);
      }
    }
    
    ensureProfile();
  }, [user, supabase, createEmptyProfile]);

  const handleCreateRoom = async (name: string, description: string) => {
    if (!user) {
      toast.error('You must be logged in to create a room');
      return;
    }
    
    try {
      await createRoom(name, description);
      fetchRooms(); // Refresh rooms list
    } catch (error) {
      console.error('Error in handleCreateRoom:', error);
      toast.error('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      setSelectedRoom(roomId);
      await joinRoom(roomId);
      toast.success('Joined room successfully');
      // In a real app, this would navigate to the room
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setSelectedRoom(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CreateRoomModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />
      
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-zinc-800 z-10">
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-1.5 rounded-md">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">vibe</span>
          </Link>
          
          <div className="flex gap-4 items-center">
            <button className="p-2 text-zinc-400 hover:text-white">
              <Search className="h-5 w-5" />
            </button>
            <div onClick={() => setShowCreateModal(true)}>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-1" />
                New Room
              </Button>
            </div>
            {user && (
              <UserProfileLink 
                username={profile?.username}
                displayName={profile?.display_name}
                avatarUrl={profile?.avatar_url}
                themeColor={profile?.theme_color || '#6366f1'}
                size="sm"
              />
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Audio Rooms</h1>
          <p className="text-zinc-400">Join conversations or create your own room</p>
        </div>
        
        {roomsLoading ? (
          <div className="grid place-items-center h-80">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading rooms...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 text-center">
            <p className="text-red-200">Error loading rooms. Please try again.</p>
            <Button 
              variant="outline" 
              className="mt-4 border-red-800/30 text-red-200 hover:bg-red-900/20"
              onClick={() => fetchRooms()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-zinc-900/80 border-zinc-800 overflow-hidden hover:border-purple-500/50 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-white flex justify-between items-start">
                    {room.name}
                    {room.created_by === user?.id && (
                      <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full">Host</span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">{room.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-zinc-400 text-sm">
                    <Users size={16} className="mr-2" />
                    <span>{room.activeParticipantCount || 0} active {room.activeParticipantCount === 1 ? 'participant' : 'participants'}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-800 pt-3">
                  <Button 
                    variant="default"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all"
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={selectedRoom === room.id}
                  >
                    {selectedRoom === room.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Mic size={16} className="mr-2" />
                        Join Room
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold mb-2 text-white">No rooms available</h3>
            <p className="text-zinc-400 mb-6">Create your first room or join one when they become available</p>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} className="mr-2" />
              Create Your First Room
            </Button>
          </div>
        )}
        
        <div className="mt-12 mb-4">
          <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Create a Room</CardTitle>
                <CardDescription className="text-zinc-400">
                  Start your own audio conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="text-zinc-300">
                <p>Create a room to host discussions on any topic and invite others to join.</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Join Conversations</CardTitle>
                <CardDescription className="text-zinc-400">
                  Connect with others in audio rooms
                </CardDescription>
              </CardHeader>
              <CardContent className="text-zinc-300">
                <p>Browse available rooms and join conversations that interest you.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
