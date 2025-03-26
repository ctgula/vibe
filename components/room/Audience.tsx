import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Users } from 'lucide-react';

interface ListenerProps {
  id: string;
  name: string;
  avatar?: string;
  hasRaisedHand: boolean;
}

interface AudienceProps {
  listeners: ListenerProps[];
  currentUserId: string;
  promoteToSpeaker: (userId: string) => Promise<void>;
  updateRoomActivity: () => Promise<void>;
  onRaiseHand?: (userId: string) => Promise<void>;
  roomId?: string;
}

export function Audience({ 
  listeners, 
  currentUserId, 
  promoteToSpeaker, 
  updateRoomActivity,
  onRaiseHand,
  roomId
}: AudienceProps) {
  const handlePromote = async (userId: string) => {
    await promoteToSpeaker(userId);
    // Update room activity when promoting a user
    await updateRoomActivity();
  };

  const handleRaiseHand = async (userId: string) => {
    if (onRaiseHand) {
      await onRaiseHand(userId);
    } else if (roomId) {
      // Fallback if onRaiseHand is not provided
      const supabase = (await import('@/lib/supabase')).supabase;
      const { error } = await supabase
        .from('room_participants')
        .update({ has_raised_hand: true })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Failed to raise hand:', error);
      } else {
        await updateRoomActivity();
      }
    }
  };

  // If no listeners and none of them is the current user, don't render anything
  const hasCurrentUser = listeners.some(listener => listener.id === currentUserId);
  if (listeners.length === 0 && !hasCurrentUser) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full p-5 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-xl border border-zinc-800/30 shadow-lg shadow-black/10 overflow-hidden mt-6"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl -z-10" />
      
      {/* Audience Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Users className="w-4 h-4 text-zinc-400" />
          </motion.div>
          <h2 className="text-lg font-medium text-zinc-200">🎧 Just Listening</h2>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/70 text-zinc-300 text-xs font-medium border border-zinc-700/30 shadow-inner"
        >
          <motion.span 
            animate={{ 
              scale: [1, 1.2, 1],
              backgroundColor: ['rgb(16, 185, 129)', 'rgb(5, 150, 105)', 'rgb(16, 185, 129)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block w-2 h-2 rounded-full bg-emerald-500"
          />
          {(listeners ?? []).length} listening
        </motion.div>
      </div>

      {/* Listeners Grid - Clubhouse style with smaller avatars */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
        <AnimatePresence mode="popLayout">
          {(listeners ?? []).length > 0 ? (
            (listeners ?? []).map((listener, index) => (
              <motion.div
                key={listener.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: {
                    delay: index * 0.03, // Faster staggered animation
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  {/* Raised hand indicator with animation */}
                  {listener.hasRaisedHand && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        rotate: [0, -10, 0, 10, 0]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="absolute -top-2 -right-1 z-10"
                    >
                      <span className="text-xs">✋</span>
                    </motion.div>
                  )}
                  
                  {/* Listener avatar */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (currentUserId === listener.id && listener.hasRaisedHand) {
                        onRaiseHand?.(listener.id);
                      }
                    }}
                  >
                    <img
                      src={listener.avatar || "/default-avatar.png"}
                      alt={listener.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-zinc-700/50"
                    />
                  </motion.div>

                  {/* Name only - simplified */}
                  <div className="mt-1 text-center">
                    <p className="font-medium text-white text-xs truncate max-w-[60px] mx-auto">
                      {listener.name}
                    </p>
                  </div>

                  {/* Raise Hand button for current user if not already raised - simplified */}
                  {listener.id === currentUserId && !listener.hasRaisedHand && (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRaiseHand(listener.id)}
                      className="mt-1 px-2 py-0.5 text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors flex items-center gap-1"
                    >
                      <span>✋</span>
                    </motion.button>
                  )}
                  
                  {/* Promote button for speakers when someone raises hand - simplified */}
                  {currentUserId !== listener.id && listener.hasRaisedHand && (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePromote(listener.id)}
                      className="mt-1 px-2 py-0.5 text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors"
                    >
                      +
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              className="col-span-full flex items-center justify-center py-4"
            >
              <div className="relative overflow-hidden">
                <motion.div 
                  animate={{
                    x: ["0%", "100%"],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
