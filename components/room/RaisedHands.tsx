import { motion } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';

interface ParticipantWithRaisedHand {
  id: string;
  name: string;
}

interface RaisedHandsProps {
  participants: ParticipantWithRaisedHand[];
  onApprove: (userId: string) => Promise<void>;
  onDismiss?: (userId: string) => Promise<void>;
}

export function RaisedHands({ participants, onApprove, onDismiss }: RaisedHandsProps) {
  if (participants.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-amber-200 flex items-center">
          <span className="mr-2">✋</span> Hand Raised
        </h3>
        <span className="text-xs text-amber-200/70 bg-amber-500/20 px-2 py-0.5 rounded-full">
          {participants.length} {participants.length === 1 ? 'request' : 'requests'}
        </span>
      </div>
      
      <div className="space-y-2">
        {participants.map((participant) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
          >
            <span className="text-sm text-zinc-200">{participant.name}</span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onApprove(participant.id)}
                className="px-2 py-1 text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white rounded-md transition-colors flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> Approve
              </motion.button>
              
              {onDismiss && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDismiss(participant.id)}
                  className="p-1 text-xs text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
