import { motion } from 'framer-motion';
import { Mic, MicOff, Hand, LogOut, Video, VideoOff } from 'lucide-react';

interface ControlsProps {
  isMuted: boolean;
  isSpeaker: boolean;
  hasRaisedHand: boolean;
  isCameraOn?: boolean;
  showCameraButton?: boolean;
  onToggleMute: () => void;
  onToggleRaiseHand?: () => void;
  onLeaveRoom: () => void;
  onToggleCamera?: () => void;
}

export function Controls({
  isMuted,
  isSpeaker,
  hasRaisedHand,
  isCameraOn,
  showCameraButton,
  onToggleMute,
  onToggleRaiseHand,
  onLeaveRoom,
  onToggleCamera,
}: ControlsProps) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md"
    >
      <div className="relative max-w-md mx-auto flex items-center justify-between">
        {/* Glass effect container */}
        <div className="absolute inset-x-0 -top-10 bottom-0 bg-black/20 backdrop-blur-sm rounded-t-2xl border-t border-x border-white/5 -z-10" />
        
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMute}
            className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full ${
              isMuted 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
            } transition-all duration-200 shadow-lg`}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <motion.div
              animate={isMuted ? { rotate: [0, -10, 0] } : { scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </motion.div>
            <span className="absolute -inset-0.5 rounded-full border border-current opacity-50" />
            
            {/* Pulsing effect when active */}
            {!isMuted && (
              <motion.span 
                className="absolute inset-0 rounded-full border border-emerald-500"
                animate={{ 
                  boxShadow: ['0 0 0 0px rgba(16, 185, 129, 0)', '0 0 0 4px rgba(16, 185, 129, 0.2)', '0 0 0 8px rgba(16, 185, 129, 0)'],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            )}
          </motion.button>

          {/* Raise Hand Button (only for non-speakers) */}
          {!isSpeaker && onToggleRaiseHand && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleRaiseHand}
              className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full ${
                hasRaisedHand 
                  ? 'bg-amber-500/30 text-amber-400 hover:bg-amber-500/40' 
                  : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/70'
              } transition-all duration-200 shadow-lg`}
              aria-label={hasRaisedHand ? "Lower Hand" : "Raise Hand"}
            >
              <motion.div
                animate={hasRaisedHand ? { y: [0, -5, 0] } : {}}
                transition={{ duration: 0.5, repeat: hasRaisedHand ? Infinity : 0, repeatDelay: 1 }}
              >
                <Hand className="w-6 h-6" />
              </motion.div>
            </motion.button>
          )}

          {/* Camera Button (only for speakers in video-enabled rooms) */}
          {showCameraButton && onToggleCamera && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleCamera}
              className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full ${
                isCameraOn 
                  ? 'bg-indigo-500/30 text-indigo-400 hover:bg-indigo-500/40' 
                  : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/70'
              } transition-all duration-200 shadow-lg`}
              aria-label={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              <motion.div
                animate={isCameraOn ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </motion.div>
            </motion.button>
          )}
        </div>

        {/* Leave Room Button */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgb(239, 68, 68)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveRoom}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full transition-all duration-300 shadow-lg"
          aria-label="Leave Room"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium">Leave</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
