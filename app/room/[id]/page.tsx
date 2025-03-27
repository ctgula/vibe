'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useParticipants } from '@/hooks/useParticipants';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage } from '@/components/room/Stage';
import { Audience } from '@/components/room/Audience';
import { Controls } from '@/components/room/Controls';
import { RaisedHands } from '@/components/room/RaisedHands';
import { MessageCircle, X, ChevronDown, Video } from 'lucide-react';
import { PageTransition } from '@/components/transitions/PageTransition';
import { useGuestSession } from '@/hooks/useGuestSession';
import { VideoChat } from '@/components/VideoChat';

export default function Room({ params }: { params: { id: string } }) {
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [user, setUser] = useState<any>({
    id: '00000000-0000-0000-0000-000000000000',
    name: `Guest ${Math.floor(Math.random() * 1000)}`,
  });
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<string[]>([]);
  
  // Use the participants hook
  const { participants, userStatus, loading: participantsLoading } = useParticipants(params.id, user.id);
  
  // Filter participants into speakers and listeners
  const speakers = participants.filter(p => p.isSpeaker);
  const listeners = participants.filter(p => !p.isSpeaker);

  // Update local state based on user status from the hook
  useEffect(() => {
    if (userStatus) {
      setIsSpeaker(userStatus.isSpeaker);
      setIsMuted(userStatus.isMuted);
      setHasRaisedHand(userStatus.hasRaisedHand);
    }
  }, [userStatus]);

  // Check if user is the host of this room from localStorage
  useEffect(() => {
    const storedHost = localStorage.getItem("isHost");
    const storedRoomId = localStorage.getItem("roomId");

    if (
      storedHost === "true" &&
      storedRoomId === params.id &&
      user.id // make sure userId is available
    ) {
      const updateHostStatus = async () => {
        await supabase
          .from("room_participants")
          .update({ is_host: true, is_speaker: true })
          .eq("room_id", params.id)
          .eq("user_id", user.id);
      };

      updateHostStatus();
    }
  }, [params.id, user.id]);

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load guest profile from localStorage
  useEffect(() => {
    const loadGuestProfile = async () => {
      try {
        setIsJoining(true);
        const guestProfileId = localStorage.getItem('guestProfileId');
        
        if (!guestProfileId) {
          console.error('No guest profile found in localStorage');
          router.push('/');
          return;
        }
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', guestProfileId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }
        
        if (profileData) {
          console.log('✅ Loaded guest profile:', profileData.name);
          setUser({
            id: profileData.id,
            name: profileData.name,
            avatar: profileData.avatar_url
          });
          
          // Ensure user is in the room
          await ensureUserInRoom(guestProfileId, params.id);
        } else {
          console.error('Profile not found');
          router.push('/');
        }
      } catch (err) {
        console.error('Error loading guest profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsJoining(false);
      }
    };
    
    loadGuestProfile();
  }, [params.id, router]);
  
  // Helper function to ensure user is in the room
  const ensureUserInRoom = async (userId: string, roomId: string) => {
    try {
      // Check if user is already in the room
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();
        
      if (!existingParticipant) {
        // Join as listener if not already in room
        const { error: joinError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: userId,
            is_speaker: false,
            is_muted: true,
            has_raised_hand: false,
            joined_at: new Date().toISOString()
          });
          
        if (joinError) {
          console.error('Error joining room:', joinError);
          throw joinError;
        }
        
        console.log('✅ Joined room as listener');
      } else {
        console.log('✅ User already in room');
      }
      
      // Update room activity
      await supabase
        .from('rooms')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', roomId);
        
    } catch (err) {
      console.error('Error ensuring user in room:', err);
      throw err;
    }
  };

  // Initialize audio stream when user becomes a speaker
  useEffect(() => {
    let mounted = true;
    
    const initializeAudioStream = async () => {
      try {
        // Only initialize audio if user is a speaker and not already initialized
        if (isSpeaker && !audioStream) {
          console.log('🎤 Initializing audio stream for speaker...');
          
          // Request audio permissions
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          
          if (mounted) {
            setAudioStream(stream);
            streamRef.current = stream;
            
            // Apply mute state to the audio tracks
            stream.getAudioTracks().forEach(track => {
              track.enabled = !isMuted;
            });
            
            console.log('✅ Audio stream initialized successfully');
          }
        }
      } catch (err) {
        console.error('❌ Error initializing audio stream:', err);
        if (mounted) {
          setError('Failed to access microphone. Please check your permissions.');
        }
      }
    };
    
    if (isSpeaker) {
      initializeAudioStream();
    }
    
    return () => {
      mounted = false;
    };
  }, [isSpeaker, audioStream]);

  // Apply mute state changes to the audio stream
  useEffect(() => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      console.log(`🔊 Audio track ${isMuted ? 'muted' : 'unmuted'}`);
    }
  }, [isMuted, audioStream]);

  // Fetch room details and set up subscriptions
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        // Fetch room details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', params.id)
          .single();

        if (roomError) {
          console.error('Error fetching room:', roomError);
          setError('Failed to load room details. The room may no longer exist.');
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
      } catch (err: any) {
        console.error('Error fetching room data:', err);
        setError(err.message);
      }
    };

    fetchRoomDetails();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('room-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${params.id}` },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch the sender's name
          supabase
            .from('profiles')
            .select('name')
            .eq('id', newMessage.user_id)
            .single()
            .then(({ data }) => {
              setMessages((prev) => [...prev, { ...newMessage, profiles: data }]);
              
              // If messages panel is closed, increment unread count
              if (!showMessages) {
                setUnreadCount((prev) => prev + 1);
              }
              
              // Scroll to bottom if messages panel is open
              if (showMessages) {
                scrollToBottom();
              }
            });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [params.id, showMessages]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
      user_id: user.id,
      content: messageText,
      created_at: new Date().toISOString(),
      profiles: { name: user.name },
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
          user_id: user.id,
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
        .eq('user_id', user.id);

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
        .eq('user_id', user.id);

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
      // Stop any active media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      
      // Remove the user from the room_participants table
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', params.id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error removing participant record:', error);
      }
      
      // Update room activity when user leaves
      await updateRoomActivity();
      
      // Navigate back to home
      router.push('/');
    } catch (err) {
      console.error('Error leaving room:', err);
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
    if (user && room) {
      updateRoomActivity();
    }
  }, [user, room]);

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
  const participantsWithRaisedHands = listeners.filter((listener) => listener.hasRaisedHand).map((listener) => ({
    id: listener.id,
    name: listener.name,
    avatar: listener.avatar || undefined
  }));

  // Ensure listeners have proper avatar format for TypeScript compatibility
  const listenersWithFormattedProps = listeners.map(listener => ({
    ...listener,
    avatar: listener.avatar || undefined
  }));

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center p-8 rounded-lg bg-zinc-800 max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Room</h2>
          <p className="text-zinc-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
          >
            Go Back Home
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
          <p className="text-zinc-300">Setting up your audio and preparing the space</p>
        </div>
      </div>
    );
  }

  if (!room || participantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-zinc-900 text-white">
        {/* Room Header with Info */}
        <div className="bg-gradient-to-b from-indigo-900/30 to-zinc-900/0 backdrop-blur-sm border-b border-white/5 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{room?.name || 'Loading room...'}</h1>
                {room?.description && (
                  <p className="text-zinc-300 mb-3 max-w-xl">{room.description}</p>
                )}
                
                {/* Display room topics */}
                {room?.topics && room.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {room.topics.map((topic: string, index: number) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleLeaveRoom}
                className="flex items-center justify-center px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
              >
                <span className="mr-1.5">Leave</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
            
            {/* Host info - simplified since we don't have the profile data */}
            <div className="flex items-center mt-3">
              <div className="flex items-center text-sm text-zinc-400">
                <span className="mr-2">Room created by</span>
                <span className="font-medium text-zinc-300">Host</span>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Stage section - only rendered when there are speakers */}
          {speakers.length > 0 && (
            <>
              <Stage 
                speakers={speakersWithCameraStatus} 
                currentUserId={user.id} 
                videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                videoStream={videoStream} 
                isCameraOn={isCameraOn}
                isHost={isHost}
                onMuteSpeaker={handleMute}
                onRemoveSpeaker={handleKick}
                onPromoteSpeaker={handlePromote}
              />
              
              {/* Raised Hands Section (only visible to speakers) */}
              {(isSpeaker || isHost) && participantsWithRaisedHands.length > 0 && (
                <RaisedHands
                  participants={participantsWithRaisedHands}
                  onApprove={handlePromoteToSpeaker}
                  onDismiss={handleDismissRaisedHand}
                />
              )}
              
              {/* Video Chat Section */}
              <div className="mt-6 mb-6 bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4">
                <VideoChat roomId={params.id} userId={user.id} />
              </div>
            </>
          )}

          {/* Audience Section - with proper spacing based on speakers presence */}
          <div className={`${speakers.length === 0 ? 'pt-10' : ''}`}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>In the Room</span>
                <span className="text-sm font-normal text-zinc-400">({listeners.length})</span>
              </h2>
              <p className="text-zinc-400 text-sm">
                {speakers.length === 0 
                  ? "No one is speaking yet. Join the stage to start the conversation!" 
                  : "These people are listening to the conversation."}
              </p>
            </div>
            
            <Audience 
              listeners={listenersWithFormattedProps}
              currentUserId={user.id}
              promoteToSpeaker={handlePromoteToSpeaker}
              updateRoomActivity={updateRoomActivity}
              onRaiseHand={handleAudienceRaiseHand}
              roomId={params.id}
            />
          </div>
        </main>

        {/* Room Controls */}
        <Controls 
          isMuted={isMuted} 
          onToggleMute={handleToggleMute}
          hasRaisedHand={hasRaisedHand}
          onToggleRaiseHand={!isSpeaker ? handleRaiseHand : undefined}
          isSpeaker={isSpeaker}
          onLeaveRoom={handleLeaveRoom}
          isCameraOn={isCameraOn}
          onToggleCamera={handleToggleCamera}
          showCameraButton={isSpeaker && roomHasVideoEnabled}
        />

        {/* Messages Panel */}
        <AnimatePresence>
          {showMessages && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 z-20 flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-100">Chat</h2>
                <button
                  onClick={toggleMessages}
                  className="p-1 rounded-full hover:bg-zinc-800 transition"
                  aria-label="Close Chat"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <p>No messages yet</p>
                    <p className="text-xs mt-1">Be the first to say something!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        message.user_id === user.id ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          message.user_id === user.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-800 text-zinc-100'
                        } ${message.is_optimistic ? 'opacity-70' : ''}`}
                      >
                        <p className="text-xs font-medium mb-1">
                          {message.user_id === user.id
                            ? 'You'
                            : message.profiles?.name || 'Anonymous'}
                        </p>
                        <p className="break-words">{message.content}</p>
                      </div>
                      <span className="text-xs text-zinc-500 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 transition"
                    aria-label="Send Message"
                  >
                    <ChevronDown className="w-5 h-5 transform rotate-90" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
