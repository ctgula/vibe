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
import { useToast } from '@/components/ui/use-toast';

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
          setError('Guest profile not found. Please try again.');
          toast({
            title: "Guest profile not found",
            description: "Please try again or refresh the page.",
            variant: "destructive"
          });
          setIsCreating(false);
          return;
        }
      }

      // Create room with transaction to ensure all related records are created
      const roomId = uuidv4();
      const roomData = {
        id: roomId,
        name: name.trim(),
        description: description.trim(),
        topics: tags,
        created_by: userId,
        is_active: true,
        is_private: isPrivate,
      };

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([roomData])
        .single();

      if (roomError) {
        setError(roomError.message);
        toast({
          title: "Error creating room",
          description: roomError.message,
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      toast({
        title: "Room created!",
        description: `Welcome to ${roomData.name}`,
        variant: "default"
      });
      router.replace(`/rooms/${roomId}`);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      toast({
        title: "Error",
        description: err.message || 'Unknown error',
        variant: "destructive"
      });
    } finally {
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
                <Button type="submit" disabled={isCreating} className="flex items-center">
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
