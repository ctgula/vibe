import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Users } from 'lucide-react';
import { useParticipantProfiles } from '@/hooks/useParticipantProfiles';

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
  // Fetch profiles for all listeners
  const listenerIds = listeners.map(listener => listener.id);
  const { profiles, loading: profilesLoading } = useParticipantProfiles(listenerIds);

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
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-6">
        <AnimatePresence mode="popLayout">
          {(listeners ?? []).length > 0 ? (
            (listeners ?? []).map((listener, index) => {
              // Get the profile data, with robust fallbacks for missing data
              const profile = profiles?.find((p: { id: string }) => p.id === listener.id);
              const name = profile?.name || profile?.display_name || listener.name || 'Anonymous';
              
              // Enhanced avatar handling with fallbacks
              let avatar = profile?.avatar_url || listener.avatar;
              if (!avatar) {
                // If no avatar, generate one from Dicebear with consistent seed
                avatar = `https://api.dicebear.com/6.x/avataaars/svg?seed=${listener.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
              } else if (avatar.includes("null") || avatar === "null") {
                // Handle common error case where avatar url is "null" as a string
                avatar = `https://api.dicebear.com/6.x/avataaars/svg?seed=${listener.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
              }
             
              return (
                <motion.div
                  key={listener.id}
                  layoutId={`listener-${listener.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 15 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 cursor-pointer p-2 relative group"
                  onClick={() => {
                    if (listener.id === currentUserId) {
                      handleRaiseHand(listener.id);
                    } else if (listeners.length > 1) {
                      handlePromote(listener.id);
                    }
                  }}
                >
                  <div className="relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full animate-pulse-slow"></div>
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <motion.div 
                      className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Enhanced error handling for failed images
                          e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${listener.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                        }}
                      />
                    </motion.div>
                    
                    {listener.hasRaisedHand && (
                      <motion.span
                        className="absolute -bottom-1 -right-1 flex items-center justify-center h-5 w-5 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full shadow-lg border border-amber-300/30"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, 0] 
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 2,
                          repeatType: "reverse"
                        }}
                      >
                        <Hand className="h-3 w-3 text-white" />
                      </motion.span>
                    )}
                  </div>
                  
                  <div className="text-center max-w-full">
                    <motion.span 
                      className="text-xs font-medium text-zinc-300 truncate inline-block max-w-full px-1 rounded group-hover:bg-zinc-800/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      {name.length > 10 ? `${name.substring(0, 10)}...` : name}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })
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
