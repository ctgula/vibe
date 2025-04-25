'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useParticipants } from '@/hooks/useParticipants';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useRoomNotifications } from '@/hooks/useNotifications';
import { useNotification } from '@/contexts/NotificationContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Stage } from '@/components/room/Stage';
import { Audience } from '@/components/room/Audience';
import { Controls } from '@/components/room/Controls';
import { RaisedHands } from '@/components/room/RaisedHands';
import { MessageCircle, X, ChevronDown, Video, Bell, Users, FileUp, PenTool, Link, Sparkles } from 'lucide-react';
import { PageTransition } from '@/components/transitions/PageTransition';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { Notifications } from '@/components/Notifications';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { ActivityLog } from '@/components/ActivityLog';
import { Poll } from '@/components/Poll';
import { RoomThemeEditor } from '@/components/RoomThemeEditor';
import { FileUploader } from '@/components/FileUploader';
import { RoomHeader } from '@/components/room/RoomHeader';
import { useToast } from '@/hooks/use-toast';

export default function Room({ params }: { params: { id: string } }) {
  const { user, profile, guestId, isGuest, isAuthenticated, ensureSessionToken } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isJoining, setIsJoining] = useState(true);
  const [roomHasVideoEnabled, setRoomHasVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [audience, setAudience] = useState<any[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<string[]>([]);
  const { toast } = useToast();

  // State for new features
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Get the user ID with proper type safety
  const id = user?.id ?? guestId;

  // If no user ID is available, return early - fixes TypeScript error
  if (!id) {
    toast({
      title: "Session required",
      description: "Please login or use guest mode to join a room.",
      variant: "destructive"
    });
    useEffect(() => {
      router.replace('/');
    }, [router]);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4">
        <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Required</h2>
          <p className="text-zinc-300 mb-4">You must be logged in or in guest mode to join this room.</p>
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold"
            onClick={() => router.replace('/')}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Enhanced loading state
  if (isJoining) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4">
        <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Joining Room...</h2>
          <p className="text-zinc-300">Please wait while we connect you to the vibe.</p>
        </div>
      </div>
    );
  }

  // Error toast for major failures
  useEffect(() => {
    if (error) {
      toast({
        title: "Room Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // If participant is not active (real-time bug case)
  useEffect(() => {
    if (room && activeParticipants && id && !activeParticipants.includes(id)) {
      toast({
        title: "Inactive Participant",
        description: "You are not an active participant in this room.",
        variant: "destructive"
      });
      router.replace('/directory');
    }
  }, [room, activeParticipants, id, router, toast]);

  // Use the participants hook with type-safe ID
  const { participants, userStatus, loading: participantsLoading } = useParticipants(params.id, id);

  // Get notification context
  const { addNotification } = useNotification();

  // Initialize room notifications
  useRoomNotifications(params.id);

  // Add swipe gestures for mobile
  useSwipeGesture({
    onSwipeLeft: () => {
      if (!showMessages) {
        setShowMessages(true);
        setUnreadCount(0);
      }
    },
    onSwipeRight: () => {
      if (showMessages) {
        setShowMessages(false);
      }
    },
    threshold: 70
  });

  // Subscribe to participant changes
  useEffect(() => {
    if (!params.id || !room) return;

    try {
      const participantsSubscription = supabase
        .channel(`room-participants:${params.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'room_participants',
          filter: `room_id=eq.${params.id}`
        }, (payload) => {
          console.log('Participant update:', payload);
          
          // Refresh participant lists
          fetchParticipants();
          
          // Handle participant removal
          if (payload.eventType === 'DELETE' && 
              (payload.old.user_id === user?.id || payload.old.user_id === guestId)) {
            setError('You have been removed from this room');
            router.push('/');
          }
        })
        .subscribe((status) => {
          console.log('Participants subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to participant updates');
          }
        });

      return () => {
        participantsSubscription.unsubscribe();
      };
    } catch (err) {
      console.error('Error in participants subscription:', err);
      setError('Failed to subscribe to participant updates');
    }
  }, [params.id, room, user?.id, guestId, router]);

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('room_participants')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_guest
          )
        `)
        .eq('room_id', params.id)
        .eq('is_active', true);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      // Process participants
      const speakers = participantsData
        .filter(p => p.is_speaker)
        .map(p => ({
          ...p,
          profile: p.profiles
        }));

      const audience = participantsData
        .filter(p => !p.is_speaker)
        .map(p => ({
          ...p,
          profile: p.profiles
        }));

      // Update state
      setSpeakers(speakers);
      setAudience(audience);

      // Check current user's status
      const currentUserId = user?.id || guestId;
      const currentParticipant = participantsData.find(p => p.user_id === currentUserId);
      
      if (currentParticipant) {
        setIsSpeaker(currentParticipant.is_speaker);
        setIsMuted(currentParticipant.is_muted);
      }
    } catch (err) {
      console.error('Error in fetchParticipants:', err);
    }
  };

  // Fetch room details and set up subscriptions
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        if (!params.id) {
          setError('Room ID is required');
          return;
        }

        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', params.id)
          .single();

        if (roomError) {
          console.error('Error fetching room:', roomError);
          setError(roomError.message);
          return;
        }

        if (!roomData) {
          setError('Room not found');
          return;
        }

        setRoom(roomData);
        setRoomHasVideoEnabled(roomData.has_camera || false);
        
        // Set document title to room name for better PWA experience
        if (typeof document !== 'undefined') {
          document.title = `${roomData.name || 'Room'} | Vibe`;
        }

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('room_messages')
          .select('*, profiles:user_id(name)')
          .eq('room_id', params.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // Scroll to bottom of messages
        scrollToBottom();
      } catch (err) {
        console.error('Error in fetchRoomData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room');
      }
    };

    fetchRoomData();
  }, [params.id]);

  useEffect(() => {
    if (!params.id || !room) return;

    try {
      const roomSubscription = supabase
        .channel(`room:${params.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'rooms',
          filter: `id=eq.${params.id}`
        }, (payload) => {
          console.log('Room update:', payload);
          if (payload.eventType === 'DELETE') {
            setError('This room has been deleted');
            return;
          }
          setRoom(payload.new);
        })
        .subscribe((status) => {
          console.log('Room subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to room updates');
          }
        });

      return () => {
        roomSubscription.unsubscribe();
      };
    } catch (err) {
      console.error('Error in room subscription:', err);
      setError('Failed to subscribe to room updates');
    }
  }, [params.id, room]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // Optimistically add message to UI
    const optimisticMessage = {
      id: Date.now().toString(),
      room_id: params.id,
      user_id: user?.id || guestId,
      content: messageText,
      created_at: new Date().toISOString(),
      profiles: { name: profile?.display_name || profile?.username || 'Guest' },
      is_optimistic: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    scrollToBottom();

    try {
      // Send message to database
      const { error: messageError } = await supabase
        .from('room_messages')
        .insert({
          room_id: params.id,
          user_id: user?.id || guestId,
          content: messageText,
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        throw messageError;
      }
      
      // Update room's last_active_at timestamp
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', params.id);
        
      if (roomError) {
        console.error('Error updating room activity:', roomError);
      }
    } catch (err) {
      console.error('Error in message flow:', err);
      
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const handleToggleMute = async () => {
    try {
      // Get the current state before toggling
      const currentMuteState = isMuted;
      console.log('🔄 Toggling mute state from', currentMuteState, 'to', !currentMuteState);
      
      // Update local state immediately for responsive UI
      setIsMuted(!currentMuteState);
      
      // Apply mute state to audio tracks if stream exists
      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => {
          track.enabled = currentMuteState; // Enable if currently muted
        });
      } else if (isSpeaker) {
        // Initialize audio stream if it doesn't exist yet
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          
          setAudioStream(stream);
          streamRef.current = stream;
          
          // Apply mute state to the new audio tracks
          stream.getAudioTracks().forEach(track => {
            track.enabled = currentMuteState; // Enable if currently muted
          });
        } catch (err) {
          console.error('❌ Error initializing audio stream during mute toggle:', err);
          setError('Failed to access microphone. Please check your permissions.');
          // Revert mute state if we couldn't initialize audio
          setIsMuted(currentMuteState);
          return;
        }
      }
      
      // Then update the database
      const { error } = await supabase
        .from('room_participants')
        .update({ is_muted: !currentMuteState })
        .eq('room_id', params.id)
        .eq('user_id', user?.id || guestId);

      if (error) {
        console.error('❌ Failed to toggle mute:', error);
        // Revert local state if database update fails
        setIsMuted(currentMuteState);
        
        // Also revert audio track state
        if (audioStream) {
          audioStream.getAudioTracks().forEach(track => {
            track.enabled = !currentMuteState; // Revert to previous state
          });
        }
        return;
      }

      console.log(`✅ ${currentMuteState ? 'Unmuted' : 'Muted'} successfully`);
      
      // Don't update the participants list here - let the real-time subscription handle it
      // This prevents the UI from flickering between states
    } catch (err) {
      console.error('❌ Error toggling mute:', err);
      // Revert local state if there's an error
      setIsMuted(isMuted);
    }
  };

  const handleRaiseHand = async () => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({
          has_raised_hand: !hasRaisedHand
        })
        .eq('room_id', params.id)
        .eq('user_id', user?.id || guestId);

      if (error) {
        console.error('Failed to raise/lower hand:', error);
      } else {
        setHasRaisedHand(!hasRaisedHand);
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error in handleRaiseHand:', err);
    }
  };

  const handleAudienceRaiseHand = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ has_raised_hand: true })
        .eq('room_id', params.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Failed to raise hand:', error);
      } else {
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error raising hand:', err);
    }
  };

  // Handle muting another speaker (host only)
  const handleMuteSpeaker = async (userId: string) => {
    try {
      // Find the speaker to determine their current mute status
      const speaker = speakers.find(s => s.id === userId);
      if (!speaker) return;

      const { error } = await supabase
        .from('room_participants')
        .update({
          is_muted: !speaker.isMuted
        })
        .eq('room_id', params.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Failed to mute/unmute speaker:', error);
      } else {
        console.log(`✅ Speaker ${speaker.isMuted ? 'unmuted' : 'muted'} successfully`);
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error toggling speaker mute:', err);
    }
  };

  const handleRemoveSpeaker = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({
          is_speaker: false
        })
        .eq('room_id', params.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Failed to remove speaker:', error);
      } else {
        console.log('✅ Speaker removed from stage successfully');
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error removing speaker:', err);
    }
  };

  const handleToggleCamera = async () => {
    if (!isSpeaker) {
      console.warn("Only speakers can use camera");
      return;
    }

    try {
      if (isCameraOn && videoStream) {
        // Turn off camera
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
        setIsCameraOn(false);
      } else {
        // Turn on camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoStream(stream);
        setIsCameraOn(true);

        // Set video stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }

      // Update room activity
      await updateRoomActivity();
    } catch (err) {
      console.error('Error toggling camera:', err);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      // Update participant status
      await supabase
        .from('room_participants')
        .update({ is_active: false })
        .eq('room_id', params.id)
        .eq('user_id', user?.id || guestId);

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          room_id: params.id,
          user_id: user?.id || guestId,
          action: 'room_left',
          created_at: new Date().toISOString()
        });

      router.push('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    }
  };

  const handlePromoteToSpeaker = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({
          is_speaker: true,
          has_raised_hand: false
        })
        .eq('room_id', params.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Failed to promote user to speaker:', error);
      } else {
        console.log('✅ User promoted to speaker successfully');
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error promoting user to speaker:', err);
    }
  };

  const handleDismissRaisedHand = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({
          has_raised_hand: false
        })
        .eq('room_id', params.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Failed to dismiss raised hand:', error);
      } else {
        console.log('✅ Raised hand dismissed successfully');
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error dismissing raised hand:', err);
    }
  };

  // Host control functions
  const handleMute = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("room_participants")
        .update({ is_muted: true })
        .eq("user_id", userId)
        .eq("room_id", params.id);

      if (error) {
        console.error('Failed to mute participant:', error);
      } else {
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error in handleMute:', err);
    }
  };

  const handleKick = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("room_participants")
        .delete()
        .eq("user_id", userId)
        .eq("room_id", params.id);

      if (error) {
        console.error('Failed to kick participant:', error);
      } else {
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error in handleKick:', err);
    }
  };

  const handlePromote = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("room_participants")
        .update({ is_speaker: true, is_muted: false })
        .eq("user_id", userId)
        .eq("room_id", params.id);

      if (error) {
        console.error('Failed to promote participant:', error);
      } else {
        await updateRoomActivity();
      }
    } catch (err) {
      console.error('Error in handlePromote:', err);
    }
  };

  // Update last_active_at when user actions occur
  const updateRoomActivity = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', params.id);
      
      if (error) {
        console.error('Failed to update room activity:', error);
      }
    } catch (err) {
      console.error('Error updating room activity:', err);
    }
  };

  const toggleMessages = () => {
    setShowMessages(!showMessages);
    if (!showMessages) {
      setUnreadCount(0);
      // Scroll to bottom when opening messages
      setTimeout(scrollToBottom, 100);
    }
  };

  // Update room activity when joining
  useEffect(() => {
    if (user || guestId) {
      updateRoomActivity();
    }
  }, [user, guestId]);

  // Type-safe room ID handling
  const roomId = params.id || '';

  // Type-safe user metadata access
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  // Determine if the room has video enabled
  const canUseCamera = isSpeaker && roomHasVideoEnabled;

  // Prepare speakers with camera status
  const speakersWithCameraStatus = speakers.map(speaker => ({
    ...speaker,
    hasCameraOn: activeParticipants.includes(speaker.id),
    // Ensure avatar is never null for TypeScript compatibility
    avatar: speaker.avatar || undefined,
    // Ensure isActive is always boolean, not undefined
    isActive: speaker.isActive || false
  }));

  // Get participants with raised hands (for the RaisedHands component)
  const participantsWithRaisedHands = audience.filter((listener) => listener.hasRaisedHand).map((listener) => ({
    id: listener.id,
    name: listener.name,
    avatar: listener.avatar || undefined
  }));

  // Ensure listeners have proper avatar format for TypeScript compatibility
  const listenersWithFormattedProps = audience.map(listener => ({
    ...listener,
    avatar: listener.avatar || undefined
  }));

  // Function to generate and copy invite link
  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/join?roomId=${params.id}`;
    setInviteLink(inviteUrl);
    setShowInviteLink(true);
    
    // Log activity
    logActivity('generated_invite');
  };
  
  // Function to copy invite link to clipboard
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // Show toast or notification that link was copied
  };
  
  // Function to log activity
  const logActivity = async (action: string, details: any = {}) => {
    if (!user?.id && !guestId) return;
    
    try {
      await supabase.from("activity_logs").insert({
        room_id: roomId,
        user_id: user?.id || guestId,
        action,
        details,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Clean up when user leaves the room
  useEffect(() => {
    // This will run when the component unmounts
    return () => {
      if (user?.id || guestId) {
        // Clean up room participation when user leaves
        const cleanup = async () => {
          try {
            console.log('🧹 Cleaning up room participation...');
            const { error } = await supabase
              .from('room_participants')
              .delete()
              .eq('room_id', roomId)
              .eq('user_id', user?.id || guestId);
              
            if (error) {
              console.error('Error cleaning up room participation:', error);
            }
          } catch (err) {
            console.error('Failed to clean up:', err);
          }
        };
        
        cleanup();
      }
    };
  }, [user?.id, guestId]);

  // Update active participants
  useEffect(() => {
    setActiveParticipants([
      ...speakers.map(s => s.user_id),
      ...audience.map(a => a.user_id)
    ]);
  }, [speakers, audience]);

  // Handle loading and error states
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while room data is being fetched
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading room...</p>
        </motion.div>
      </div>
    );
  }

  // Handle room not found
  if (!room.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Room Not Found</h2>
          <p className="text-gray-400">This room may have been deleted or never existed.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center p-8 rounded-lg bg-zinc-800 max-w-md">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">Reconnecting...</h2>
          <p className="text-zinc-300">Trying to reconnect to the room. Please wait...</p>
        </div>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center p-8 rounded-lg bg-zinc-800/50 backdrop-blur-lg max-w-md">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Joining Room...</h2>
          <p className="text-zinc-400 text-sm">
            Setting up your audio and preparing the space
          </p>
        </div>
      </div>
    );
  }

  if (!room || participantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-zinc-400"
          >
            Loading room...
          </motion.p>
        </div>
      </div>
    );
  }

  // Check if current user is a host
  const isHost = userStatus?.isHost || false;

  // Get user data safely
  const displayName = profile?.display_name || userName;
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${user?.id || guestId}`;

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white">
        <div className="relative min-h-screen flex flex-col">
          <div className="relative flex-1 overflow-hidden">
            {/* Room Header */}
            <RoomHeader
              roomName={room?.name || 'Loading...'}
              participantCount={activeParticipants.length}
              onShowParticipants={() => setShowParticipants(true)}
            />

            {/* Main Content */}
            <div className="relative p-4">
              {/* Video Stage */}
              {roomHasVideoEnabled && (
                <div className="mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover rounded-2xl bg-zinc-900"
                  />
                </div>
              )}

              {/* Audience Section */}
              <Audience
                listeners={audience}
                currentUserId={user?.id || guestId || ''}
                promoteToSpeaker={handlePromoteToSpeaker}
                updateRoomActivity={updateRoomActivity}
                onRaiseHand={handleAudienceRaiseHand}
                roomId={params.id}
              />

              {/* Controls */}
              <Controls
                isMuted={isMuted}
                isSpeaker={isSpeaker}
                hasRaisedHand={hasRaisedHand}
                isCameraOn={isCameraOn}
                showCameraButton={roomHasVideoEnabled}
                showMessages={showMessages}
                unreadCount={unreadCount}
                onToggleMute={handleToggleMute}
                onToggleRaiseHand={handleRaiseHand}
                onToggleCamera={handleToggleCamera}
                onToggleMessages={toggleMessages}
                onLeaveRoom={handleLeaveRoom}
              />
            </div>

            {/* Messages Panel */}
            <AnimatePresence mode="wait">
              {showMessages && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMessages(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Chat
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowMessages(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <div className="space-y-4 mb-4">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                            {message.user.name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{message.user.name}</span>
                              <span className="text-xs text-zinc-500">{new Date(message.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-zinc-300">{message.content}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="relative">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-5 h-5 text-white" />
                      </button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications Panel */}
            <AnimatePresence mode="wait">
              {showNotifications && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNotifications(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Notifications
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <NotificationsPanel />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity Log Panel */}
            <AnimatePresence mode="wait">
              {showActivityLog && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowActivityLog(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Activity Log
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowActivityLog(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <ActivityLog roomId={roomId} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Poll Panel */}
            <AnimatePresence mode="wait">
              {showPoll && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPoll(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Polls
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowPoll(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <Poll roomId={roomId} isHost={isHost} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Uploader Panel */}
            <AnimatePresence mode="wait">
              {showFileUploader && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFileUploader(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Share Files
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowFileUploader(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <FileUploader roomId={roomId} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Room Theme Editor Panel */}
            <AnimatePresence mode="wait">
              {showThemeEditor && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowThemeEditor(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Room Theme
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowThemeEditor(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <RoomThemeEditor roomId={roomId} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invite Link Panel */}
            <AnimatePresence mode="wait">
              {showInviteLink && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInviteLink(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 pb-24 max-h-[80vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        Invite Others
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </h3>
                      <button
                        onClick={() => setShowInviteLink(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg mb-4">
                      <p className="text-zinc-300 mb-2">Share this link to invite others to join this room:</p>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={inviteLink}
                          readOnly
                          className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={copyInviteLink}
                          className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-r-lg transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
