'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/transitions/PageTransition';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/hooks/use-supabase-auth';
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
        return;
      }

      // Get current user ID (either regular user or guest)
      const userId = user?.id || guestId;
      
      if (!userId) {
        setError('Authentication required to create a room');
        return;
      }

      // If this is a guest user, ensure we have their profile
      if (!user && guestId) {
        const { data: guestProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', guestId)
          .eq('is_guest', true)
          .single();
          
        if (!guestProfile) {
          setError('Guest profile not found. Please try again.');
          return;
        }
      }

      // Create room with transaction to ensure all related records are created
      const roomId = uuidv4();
      
      // Start a transaction manually instead of using a stored procedure
      try {
        // 1. Create the room record
        const { error: roomError } = await supabase
          .from('rooms')
          .insert({
            id: roomId,
            name: name.trim(),
            description: description.trim() || null,
            topics: tags.length > 0 ? tags : null,
            created_by: user ? user.id : null,
            created_by_guest: !user ? guestId : null,
            is_public: !isPrivate,
            is_active: true,
            created_at: new Date().toISOString()
          });

        if (roomError) {
          console.error('Error creating room:', roomError);
          setError('Failed to create room. Please try again.');
          return;
        }

        // 2. Add the creator as a participant (with is_active=true)
        const { error: participantError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: user ? user.id : null,
            guest_id: !user ? guestId : null,
            is_active: true,
            joined_at: new Date().toISOString(),
            is_speaker: true,
            is_host: true
          });

        if (participantError) {
          console.error('Error adding participant:', participantError);
          setError('Failed to join the room. Please try again.');
          
          // Try to clean up the room if participant creation fails
          await supabase.from('rooms').delete().eq('id', roomId);
          return;
        }

        // Store room creator info in localStorage
        localStorage.setItem("isHost", "true");
        localStorage.setItem("roomId", roomId);
      } catch (transactionError) {
        console.error('Error in room creation:', transactionError);
        setError('Failed to create room. Please try again.');
        return;
      }

      // Navigate to the new room
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Create a Room</h1>
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
