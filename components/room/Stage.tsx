'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Video, UserMinus, Volume2, VolumeX } from 'lucide-react';

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
  videoRef: React.RefObject<HTMLVideoElement>;
  videoStream?: MediaStream | null;
  isCameraOn?: boolean;
  isHost?: boolean;
  onMuteSpeaker?: (userId: string) => Promise<void>;
  onRemoveSpeaker?: (userId: string) => Promise<void>;
  onPromoteSpeaker?: (userId: string) => Promise<void>;
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
  onPromoteSpeaker
}: StageProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, videoRef]);

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
              className="flex flex-col items-center"
            >
              {/* Speaker container with relative positioning */}
              <div className="relative">
                {/* Host badge - now a plus icon */}
                {speaker.isHost && (
                  <div className="absolute -top-1 -right-1 z-10 bg-amber-500 rounded-full p-1 shadow-lg shadow-amber-500/20 border border-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-white">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                )}
                
                {/* Active speaker indicator */}
                <div className={`absolute -bottom-0.5 right-0 z-10 w-3 h-3 rounded-full border-2 border-zinc-900 ${speaker.isActive || !speaker.isMuted ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                
                {/* Camera video or avatar */}
                {speaker.id === currentUserId && isCameraOn && videoStream ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-zinc-700/50 shadow-lg"
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ) : (
                  <img
                    src={speaker.avatar || "/default-avatar.png"}
                    alt={speaker.name}
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 ${
                      speaker.isActive || !speaker.isMuted
                        ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                        : 'border-zinc-700/50'
                    }`}
                  />
                )}

                {/* Name and Role - simplified */}
                <div className="mt-2 text-center w-full">
                  <p className="font-medium text-white text-xs truncate max-w-[80px] sm:max-w-[90px] mx-auto">
                    {speaker.name}
                  </p>
                </div>

                {/* Mute indicator - moved to a subtle icon below name */}
                {speaker.isMuted && (
                  <div className="mt-1 flex justify-center">
                    <MicOff className="w-3 h-3 text-zinc-400" />
                  </div>
                )}
              </div>

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
                    className="text-xs px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors"
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
