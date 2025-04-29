'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { UserProfileLink } from '@/components/user-profile-link';
import { Plus, Loader2, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRooms, Room, RoomWithParticipants } from '@/hooks/use-rooms';

const supabase = createClientComponentClient();

export default function RoomsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, createEmptyProfile } = useAuth();
  const { rooms, isLoading: roomsLoading, error, createRoom } = useRooms();
  const [isCreating, setIsCreating] = useState(false);
  const [roomData, setRoomData] = useState({
    name: '',
    description: '',
    topics: [] as string[]
  });
  const [topic, setTopic] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Make sure the user has a profile
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // If not logged in, redirect to login
      router.push('/auth/signin');
      return;
    }

    const ensureProfile = async () => {
      try {
        console.log('Checking if user has a profile:', user.id);
        
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
    };
    
    ensureProfile();
  }, [user, authLoading, supabase, createEmptyProfile, router]);

  const handleCreateRoom = async () => {
    if (!roomData.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    setIsCreating(true);
    try {
      console.log("Creating room with data:", roomData);
      
      const room = await createRoom(
        roomData.name.trim(),
        roomData.description.trim(),
        roomData.topics
      );

      if (room) {
        // Clear form data
        setRoomData({
          name: '',
          description: '',
          topics: []
        });
        
        // Close dialog ONLY on success
        setShowCreateDialog(false);
        
        toast.success('Room created successfully!');
        
        // Make sure we don't redirect, just stay on the rooms page
        // (the automatic redirect was causing the issue)
      } else {
        // If creation failed but no error was thrown, show a generic error
        toast.error('Failed to create room. Please try again.');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      toast.error('Failed to create room: ' + (err instanceof Error ? err.message : 'Unknown error'));
      // Don't close dialog on error so user can try again
    } finally {
      setIsCreating(false);
    }
  };

  const addTopic = () => {
    if (!topic.trim()) return;
    
    // Prevent duplicates
    if (roomData.topics.includes(topic.trim())) {
      toast.error('Topic already added');
      return;
    }
    
    setRoomData({
      ...roomData,
      topics: [...roomData.topics, topic.trim()]
    });
    setTopic('');
  };

  const removeTopic = (topicToRemove: string) => {
    setRoomData({
      ...roomData,
      topics: roomData.topics.filter(t => t !== topicToRemove)
    });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
        <p className="text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Discover Rooms</h1>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="bg-zinc-900 border-zinc-800 text-white"
              onPointerDownOutside={isCreating ? (e) => e.preventDefault() : undefined}
              onEscapeKeyDown={isCreating ? (e) => e.preventDefault() : undefined}
            >
              <DialogHeader>
                <DialogTitle>Create a New Room</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Create a space to vibe with others. Give your room a name and description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Room Name*
                  </label>
                  <Input
                    value={roomData.name}
                    onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                    placeholder="My Awesome Room"
                    className="bg-zinc-800/50 border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={roomData.description}
                    onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                    placeholder="What's this room about?"
                    className="bg-zinc-800/50 border-zinc-700 h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Topics
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Add a topic"
                      className="bg-zinc-800/50 border-zinc-700"
                      onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={addTopic}
                      className="shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                  {roomData.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {roomData.topics.map((t) => (
                        <div key={t} className="bg-zinc-800 px-2 py-1 rounded-full text-xs flex items-center">
                          {t}
                          <button 
                            onClick={() => removeTopic(t)}
                            className="ml-1 text-zinc-400 hover:text-zinc-200"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRoom} 
                  disabled={isCreating || !roomData.name.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error.message}</p>
          </div>
        )}

        {roomsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 animate-pulse h-40"></div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-medium mb-2">No Rooms Found</h3>
            <p className="text-zinc-400 mb-6">Be the first to create a room and start the vibe!</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: RoomWithParticipants }) {
  const router = useRouter();
  
  const navigateToRoom = () => {
    router.push(`/room/${room.id}`);
  };
  
  return (
    <div
      className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors cursor-pointer"
      onClick={navigateToRoom}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">{room.name}</h3>
          {room.description && (
            <p className="text-zinc-400 text-sm line-clamp-2">{room.description}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-zinc-500" />
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          <Users className="w-4 h-4 text-zinc-400 mr-1" />
          <span className="text-zinc-400 text-sm">{room.activeParticipantCount}</span>
        </div>
        
        {room.topics && room.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {room.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full"
              >
                {topic}
              </span>
            ))}
            {room.topics.length > 3 && (
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
                +{room.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {room.hostProfile && (
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center">
          <span className="text-xs text-zinc-500 mr-2">Created by</span>
          <UserProfileLink
            username={room.hostProfile.username || ''}
            displayName={room.hostProfile.display_name || ''}
            avatarUrl={room.hostProfile.avatar_url || undefined}
            themeColor={room.hostProfile.theme_color || '#6366f1'}
            size="sm"
            showName
          />
        </div>
      )}
    </div>
  );
}
