'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/transitions/PageTransition';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';
import { X, Music, Image, Tag as TagIcon } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

export default function CreateRoom() {
  const router = useRouter();
  const { user, profile, guestId, authLoading, ensureSessionToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if neither authenticated user nor guest
  useEffect(() => {
    if (mounted && !authLoading && !user && !guestId) {
      console.log("No authentication found, redirecting to home");
      router.replace('/');
    }
  }, [mounted, authLoading, user, guestId, router]);

  // Don't render anything while checking auth or before mounting
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated
  if (!user && !guestId) {
    return null;
  }

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      if (!name.trim()) {
        setError('Room name is required');
        setIsCreating(false);
        return;
      }

      // Get current user ID (either regular user or guest)
      const userId = user?.id || guestId;
      
      if (!userId) {
        setError('Authentication required to create a room');
        setIsCreating(false);
        return;
      }

      console.log('Creating room with auth state:', { 
        hasUser: !!user, 
        userId: user?.id, 
        hasGuestId: !!guestId, 
        guestId 
      });

      // If this is a guest user, ensure we have their profile
      if (!user && guestId) {
        console.log('Checking guest profile for ID:', guestId);
        const { data: guestProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', guestId)
          .eq('is_guest', true)
          .single();
          
        if (profileError) {
          console.error('Error fetching guest profile:', profileError);
          setError(`Guest profile error: ${profileError.message}`);
          setIsCreating(false);
          return;
        }
          
        if (!guestProfile) {
          console.error('Guest profile not found for ID:', guestId);
          setError('Guest profile not found. Please try again.');
          setIsCreating(false);
          return;
        }
        
        console.log('Found guest profile:', guestProfile);
      }

      // Create room with transaction to ensure all related records are created
      const roomId = uuidv4();
      
      // Prepare room data
      const roomData = {
        id: roomId,
        name: name.trim(),
        description: description.trim() || null,
        topics: tags.length > 0 ? tags : null,
        created_by: user ? user.id : null,
        created_by_guest: !user ? guestId : null,
        is_public: !isPrivate,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      console.log('Attempting to create room with data:', roomData);
      
      // Start a transaction manually instead of using a stored procedure
      try {
        // 1. Create the room record
        const { data: insertedRoom, error: roomError } = await supabase
          .from('rooms')
          .insert(roomData)
          .select();

        if (roomError) {
          console.error('Error creating room:', roomError);
          setError(`Failed to create room: ${roomError.message}`);
          setIsCreating(false);
          return;
        }
        
        console.log('Room created successfully:', insertedRoom);

        // 2. Add the creator as a participant (with is_active=true)
        const participantData = {
          room_id: roomId,
          user_id: user ? user.id : null,
          guest_id: !user ? guestId : null,
          is_active: true,
          joined_at: new Date().toISOString(),
          is_speaker: true,
          is_host: true
        };
        
        console.log('Adding participant with data:', participantData);
        
        const { data: insertedParticipant, error: participantError } = await supabase
          .from('room_participants')
          .insert(participantData)
          .select();

        if (participantError) {
          console.error('Error adding participant:', participantError);
          setError(`Failed to join the room: ${participantError.message}`);
          
          // Try to clean up the room if participant creation fails
          console.log('Cleaning up room after participant error');
          await supabase.from('rooms').delete().eq('id', roomId);
          setIsCreating(false);
          return;
        }
        
        console.log('Participant added successfully:', insertedParticipant);

        // Store room creator info in localStorage
        localStorage.setItem("isHost", "true");
        localStorage.setItem("roomId", roomId);
        
        console.log('Room creation completed, redirecting to room:', roomId);
      } catch (transactionError: any) {
        console.error('Error in room creation transaction:', transactionError);
        setError(`Transaction error: ${transactionError.message || 'Unknown error'}`);
        setIsCreating(false);
        return;
      }

      // Navigate to the new room
      router.push(`/room/${roomId}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(`An unexpected error occurred: ${error.message || 'Please try again'}`);
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white">
        <AppHeader title="Create Room" showBackButton />
        
        <main className="container max-w-md mx-auto pt-16 pb-20 px-4">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Create a Room</h1>
              <p className="text-muted-foreground mt-2">
                Start a new conversation space for people to join and vibe together.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Room Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    className="w-full"
                    disabled={isCreating}
                  />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {50 - name.length} characters remaining
                  </div>
                </div>

                <div>
                  <Textarea
                    placeholder="Room Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    className="w-full"
                    disabled={isCreating}
                  />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {500 - description.length} characters remaining
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      maxLength={20}
                      disabled={isCreating || tags.length >= 5}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      disabled={isCreating || !currentTag || tags.length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-destructive"
                            disabled={isCreating}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {5 - tags.length} tags remaining (max 5)
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
