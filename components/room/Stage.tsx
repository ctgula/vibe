'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Video, UserMinus, Volume2, VolumeX } from 'lucide-react';
import { connectToLiveKit } from '@/utils/livekit';
import { createLocalVideoTrack, createLocalAudioTrack, Room, Participant, Track } from 'livekit-client';
import { SpeakerAvatar } from '@/components/SpeakerAvatar';
import { useParticipantProfiles } from '@/hooks/useParticipantProfiles';

interface SpeakerProps {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isActive: boolean;
  isCameraOn?: boolean;
  isHost?: boolean;
}

interface StageProps {
  speakers: SpeakerProps[];
  currentUserId: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  videoStream?: MediaStream | null;
  isCameraOn?: boolean;
  isHost?: boolean;
  onMuteSpeaker?: (userId: string) => Promise<void>;
  onRemoveSpeaker?: (userId: string) => Promise<void>;
  onPromoteSpeaker?: (userId: string) => Promise<void>;
  roomId: string;
  isSpeaker?: boolean;
}

export function Stage({ 
  speakers, 
  currentUserId, 
  videoRef,
  videoStream, 
  isCameraOn,
  isHost,
  onMuteSpeaker,
  onRemoveSpeaker,
  onPromoteSpeaker,
  roomId,
  isSpeaker = true
}: StageProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());

  // Fetch profiles for all speakers
  const speakerIds = speakers.map(speaker => speaker.id);
  const { profiles, loading: profilesLoading } = useParticipantProfiles(speakerIds);

  useEffect(() => {
    // For backward compatibility with the old video implementation
    if (videoRef?.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, videoRef]);

  useEffect(() => {
    async function setupLiveKit() {
      try {
        // Fetch token from API
        const res = await fetch(`/api/token?room=${roomId}&identity=${currentUserId}`);
        const data = await res.json();
        const token = data.token;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://vibe-nxa4lizr.livekit.cloud';

        // Connect to LiveKit room
        const room = await connectToLiveKit(token, livekitUrl);
        setLivekitRoom(room);
        
        // Handle participants
        Array.from(room.remoteParticipants.values()).forEach((participant) => {
          setParticipants(prev => new Map(prev.set(participant.identity, participant)));
        });

        // Add local participant as well
        setParticipants(prev => new Map(prev.set(room.localParticipant.identity, room.localParticipant)));

        // Listen for participant events
        room.on('participantConnected', (participant) => {
          console.log("New participant connected:", participant.identity);
          setParticipants(prev => new Map(prev.set(participant.identity, participant)));
        });

        room.on('participantDisconnected', (participant) => {
          console.log("Participant disconnected:", participant.identity);
          setParticipants(prev => {
            const updated = new Map(prev);
            updated.delete(participant.identity);
            return updated;
          });
        });

        // Handle track subscriptions
        room.on('trackSubscribed', (track, publication, participant) => {
          console.log("Subscribed to", track.kind, "from", participant.identity);
        });

        room.on('trackUnsubscribed', (track, publication, participant) => {
          console.log("Unsubscribed from", track.kind, "from", participant.identity);
        });

        // Create and publish local tracks if camera is on and user is a speaker
        if (isSpeaker && isCameraOn) {
          console.log("Creating and publishing tracks as speaker");
          const videoTrack = await createLocalVideoTrack();
          const audioTrack = await createLocalAudioTrack();
          
          await room.localParticipant.publishTrack(videoTrack);
          await room.localParticipant.publishTrack(audioTrack);
        }

        // Cleanup function
        return () => {
          room.disconnect();
        };
      } catch (error) {
        console.error('Error setting up LiveKit:', error);
      }
    }

    if (roomId && currentUserId) {
      setupLiveKit();
    }

    return () => {
      if (livekitRoom) {
        livekitRoom.disconnect();
      }
    };
  }, [roomId, currentUserId, isCameraOn, isSpeaker]);

  const handleSpeakerClick = (speakerId: string) => {
    setSelectedSpeaker(speakerId === selectedSpeaker ? null : speakerId);
  };

  // If no speakers, don't render the section at all
  if (!speakers || speakers.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium mb-5 text-zinc-200">🎙 On Stage</h2>
      
      {/* Speakers grid with improved responsive layout */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {speakers.map((speaker, index) => (
            <motion.div
              key={speaker.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: {
                  delay: index * 0.05, // Staggered animation
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }
              }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <SpeakerAvatar 
                participant={speaker}
                isCurrentUser={speaker.id === currentUserId}
                livekitParticipant={participants.get(speaker.id)}
                profile={profiles[speaker.id]}
              />
              
              {/* Host controls - only visible to host and not for themselves */}
              {isHost && speaker.id !== currentUserId && (
                <div className="flex gap-1 mt-2 flex-wrap justify-center">
                  <button
                    onClick={() => onMuteSpeaker?.(speaker.id)}
                    className="text-xs px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors"
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => onRemoveSpeaker?.(speaker.id)}
                    className="text-xs px-2 py-0.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-full transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
