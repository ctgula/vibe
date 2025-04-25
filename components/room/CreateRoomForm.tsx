// This component will contain the logic from the original CreateRoom page
// I will populate this file in the next step.
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';
import { X, Tag as TagIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AppHeader } from '@/components/app-header';
import { PageTransition } from '@/components/transitions/PageTransition';

export default function CreateRoomForm() {
  const router = useRouter();
  let user, profile, guestId, authLoading, ensureSessionToken;
  try {
    ({ user, profile, guestId, authLoading, ensureSessionToken } = useAuth());
  } catch {
    user = profile = guestId = ensureSessionToken = null;
    authLoading = true;
  }
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false); // Currently unused, but kept for potential future use
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if neither authenticated user nor guest
  useEffect(() => {
    if (mounted && !authLoading && !user && !guestId) {
      toast({
        title: "No session found",
        description: "Please refresh or re-login to create a room.",
        variant: "destructive"
      });
      router.replace('/');
    }
  }, [mounted, authLoading, user, guestId, router, toast]);

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
        toast({
          title: "Room name required",
          description: "Please enter a name for your room.",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      // Get current user ID (either regular user or guest)
      const userId = user?.id || guestId;
      
      if (!userId) {
        setError('Authentication required to create a room');
        toast({
          title: "Authentication required",
          description: "Please login or use guest mode to create a room.",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      // If this is a guest user, ensure we have their profile
      let creatorUsername = profile?.username;
      if (!user && guestId) {
        const { data: guestProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', guestId)
          .eq('is_guest', true)
          .single();
        
        if (profileError) {
          setError(`Guest profile error: ${profileError.message}`);
          toast({
            title: "Guest profile error",
            description: profileError.message,
            variant: "destructive"
          });
          setIsCreating(false);
          return;
        }
        if (!guestProfile) {
           setError('Guest profile not found');
           toast({ title: "Guest profile not found", variant: "destructive" });
           setIsCreating(false);
           return;
        }
        creatorUsername = guestProfile.username;
      }
      
       if (!creatorUsername) {
          setError('Could not determine creator username.');
          toast({ title: "Username error", description: "Unable to find username.", variant: "destructive" });
          setIsCreating(false);
          return;
      }

      const roomId = uuidv4();
      const newRoom = {
        id: roomId,
        name,
        description: description || null,
        tags: tags || [],
        is_private: isPrivate,
        created_by: userId,
        is_active: true,
      };

      // 1. Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert(newRoom)
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        setError(`Failed to create room: ${roomError.message}`);
        toast({
          title: "Room creation failed",
          description: roomError.message,
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      // 2. Add the creator as a participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          is_admin: true,
          is_active: true, 
          joined_at: new Date().toISOString()
        });

      if (participantError) {
        console.error('Participant error:', participantError);
        // Consider rollback or cleanup if participant fails?
        setError(`Room created, but failed to add participant: ${participantError.message}`);
        toast({ title: "Participant add failed", description: participantError.message, variant: "default" });
        // Continue to redirect, as room exists
      }

      toast({
        title: "Room created successfully!",
        description: `Redirecting you to '${name}'...`,
      });

      // Redirect to the new room page
      router.push(`/room/${roomId}`);

    } catch (err) {
      console.error('Unexpected error creating room:', err);
      setError('An unexpected error occurred. Please try again.');
      toast({ title: "Unexpected error", description: String(err), variant: "destructive" });
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag) {
      e.preventDefault(); // Prevent form submission on Enter in tag input
      addTag();
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-900 via-black to-black text-white">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                Create a New Vibe Room
              </h1>
              <p className="text-zinc-400 mt-2 text-sm sm:text-base">
                Start a new audio conversation space.
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
                      onKeyDown={handleKeyDown} // Use onKeyDown instead of onKeyPress for broader compatibility
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
                            className="hover:text-destructive ml-1"
                            disabled={isCreating}
                            aria-label={`Remove tag ${tag}`}
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
                <Button type="submit" disabled={isCreating || !name.trim()} className="flex items-center">
                  {isCreating && <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
