'use client';

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Mic, MicOff, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isSpeaker: boolean;
  isMuted: boolean;
  hasRaisedHand: boolean;
  isHost: boolean;
  hasCameraOn?: boolean;
  isActive?: boolean;
}

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  isUserSpeaker: boolean;
  currentUserId: string;
  onPromoteToSpeaker: (userId: string) => Promise<void>;
}

export function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  isUserSpeaker,
  currentUserId,
  onPromoteToSpeaker
}: ParticipantsPanelProps) {
  // Separate participants into speakers and listeners
  const speakers = participants.filter(p => p.isSpeaker);
  const listeners = participants.filter(p => !p.isSpeaker);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed top-0 right-0 w-full sm:w-96 h-full bg-zinc-900/95 backdrop-blur-md z-50 border-l border-zinc-700/30 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold">Participants ({participants.length})</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {speakers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm uppercase text-zinc-500 font-medium mb-3">Speakers ({speakers.length})</h3>
                  <div className="space-y-2">
                    {speakers.map(speaker => (
                      <div 
                        key={speaker.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          speaker.id === currentUserId ? 'bg-indigo-900/20 border border-indigo-500/30' : 'bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={speaker.avatar} alt={speaker.name} />
                              <AvatarFallback className="bg-indigo-600">
                                {speaker.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {speaker.isActive && (
                              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-zinc-900" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <p className="font-medium">{speaker.name}</p>
                              {speaker.isHost && (
                                <Crown className="h-3.5 w-3.5 text-yellow-400 ml-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-400">
                              {speaker.id === currentUserId ? 'You' : 'Speaker'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {speaker.isMuted ? (
                            <MicOff className="h-4 w-4 text-zinc-500 mr-2" />
                          ) : (
                            <Mic className="h-4 w-4 text-green-500 mr-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {listeners.length > 0 && (
                <div>
                  <h3 className="text-sm uppercase text-zinc-500 font-medium mb-3">Listeners ({listeners.length})</h3>
                  <div className="space-y-2">
                    {listeners.map(listener => (
                      <div 
                        key={listener.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          listener.id === currentUserId ? 'bg-indigo-900/20 border border-indigo-500/30' : 'bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={listener.avatar} alt={listener.name} />
                            <AvatarFallback className="bg-zinc-600">
                              {listener.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="font-medium">{listener.name}</p>
                            <p className="text-xs text-zinc-400">
                              {listener.id === currentUserId ? 'You' : 'Listener'}
                              {listener.hasRaisedHand && (
                                <span className="ml-1.5 text-yellow-400">• Hand raised</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {isUserSpeaker && listener.hasRaisedHand && listener.id !== currentUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPromoteToSpeaker(listener.id)}
                            className="text-xs"
                          >
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Promote
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
