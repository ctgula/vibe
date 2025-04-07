'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { Track, Participant, RemoteTrackPublication, LocalTrackPublication } from 'livekit-client';

interface SpeakerAvatarProps {
  participant: {
    id: string;
    name: string;
    avatar?: string;
    isMuted: boolean;
    isActive: boolean;
    isCameraOn?: boolean;
    isHost?: boolean;
  };
  isCurrentUser?: boolean;
  livekitParticipant?: Participant;
  profile?: any; 
}

export function SpeakerAvatar({ 
  participant, 
  isCurrentUser = false,
  livekitParticipant,
  profile
}: SpeakerAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get avatar with proper fallbacks
  const getAvatarUrl = () => {
    // First try profile from DB
    if (profile && profile.avatar_url && !imageError) {
      return profile.avatar_url;
    }
    
    // Then try participant avatar
    if (participant.avatar && !imageError) {
      return participant.avatar;
    }
    
    // Finally use placeholder with consistent seed
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${participant.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  }

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Get participant name with proper fallbacks
  const getParticipantName = () => {
    if (profile && (profile.name || profile.display_name)) {
      return profile.name || profile.display_name;
    }
    return participant.name || 'Anonymous'; 
  }

  useEffect(() => {
    if (!livekitParticipant) return;

    let videoPublication: LocalTrackPublication | RemoteTrackPublication | undefined;
    
    if ('videoTracks' in livekitParticipant) {
      const tracks = livekitParticipant.videoTracks as Map<string, RemoteTrackPublication>;
      videoPublication = Array.from(tracks.values()).find(
        pub => !pub.trackName.includes('screen')
      );
    } else if ('publishedTracks' in livekitParticipant) {
      const localParticipant = livekitParticipant as any; 
      const tracks = localParticipant.videoTracks as Map<string, LocalTrackPublication>;
      videoPublication = Array.from(tracks.values()).find(
        pub => !pub.trackName.includes('screen')
      );
    }

    if (videoPublication && videoRef.current) {
      const track = videoPublication.track;
      if (track) {
        track.attach(videoRef.current);
        setHasVideo(true);
      }
      
      return () => {
        if (track) {
          track.detach();
          setHasVideo(false);
        }
      };
    }
  }, [livekitParticipant]);

  const showVideo = (isCurrentUser && participant.isCameraOn) || 
                    (!isCurrentUser && hasVideo);
  
  return (
    <div className="flex flex-col items-center relative group">
      <div className="absolute inset-0 top-0 w-full h-full rounded-full -z-10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse-slow filter blur-xl opacity-70"></div>
      <div className="relative">
        {/* Dynamic glow for active speaker */}
        {participant.isActive && (
          <motion.div 
            className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-sm"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      
        {hasVideo && videoRef.current ? (
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-xl">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
            {participant.isMuted && (
              <div className="absolute bottom-0 right-0 bg-red-600/80 rounded-full p-1 shadow-lg border border-red-500/30">
                <MicOff className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-xl"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 w-full h-full" />
            <img
              src={getAvatarUrl()}
              alt={getParticipantName()}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            {participant.isMuted && (
              <div className="absolute bottom-0 right-0 bg-red-600/80 rounded-full p-1 shadow-lg border border-red-500/30">
                <MicOff className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </motion.div>
        )}
      </div>
        
        {/* Host badge */}
        {participant.isHost && (
          <motion.div 
            className="absolute -top-1 -left-1 flex items-center justify-center h-5 w-5 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full shadow-lg border border-amber-300/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </motion.div>
        )}
        
        {/* Active speaker indicator */}
        {/* {participant.isActive && (
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-green-500"
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )} */}
        
        <div className="mt-2 text-center">
          <motion.p 
            className="text-sm font-medium text-white bg-zinc-800/50 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/5 shadow-sm"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {getParticipantName()}
            {isCurrentUser && " (You)"}
          </motion.p>
        </div>
    </div>
  );
}
