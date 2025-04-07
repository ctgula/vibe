'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Subscribe to room events
  useEffect(() => {
    if (!isClient) return;
    
    const roomEventsChannel = supabase
      .channel('room-events')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'rooms',
        filter: 'is_active=eq.true'
      }, async (payload) => {
        const newRoom = payload.new as any;
        
        // Get creator info (handle both user and guest creators)
        const { data: creator } = await supabase
          .from('profiles')
          .select('username, display_name')
          .or(`id.eq.${newRoom.created_by},id.eq.${newRoom.created_by_guest}`)
          .single();
          
        const creatorName = creator?.display_name || creator?.username || 'Someone';
        addNotification(`${creatorName} created room: ${newRoom.name}`, 'info');
      })
      .subscribe();

    // Subscribe to hand raise events
    const handRaiseChannel = supabase
      .channel('hand-raise-events')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'room_participants',
        filter: 'has_raised_hand=eq.true and is_active=eq.true'
      }, async (payload) => {
        const participant = payload.new as any;
        if (participant.has_raised_hand) {
          // Fetch the participant's name (handle both users and guests)
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .or(`id.eq.${participant.user_id},id.eq.${participant.guest_id}`)
            .single();
            
          const username = profile?.display_name || profile?.username || 'Someone';
          addNotification(`${username} raised their hand`, 'info');
        }
      })
      .subscribe();

    return () => {
      roomEventsChannel.unsubscribe();
      handRaiseChannel.unsubscribe();
    };
  }, [isClient]);

  const addNotification = (message: string, type: NotificationType, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type, duration }]);

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      {/* Only render NotificationContainer on client-side to avoid hydration mismatch */}
      {isClient && (
        <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
      )}
    </NotificationContext.Provider>
  );
}

function NotificationContainer({ 
  notifications, 
  removeNotification 
}: { 
  notifications: Notification[]; 
  removeNotification: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`
              p-4 rounded-lg shadow-lg backdrop-blur-xl border flex items-start gap-3
              ${notification.type === 'info' ? 'bg-primary/10 border-primary/20 text-primary' : ''}
              ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : ''}
              ${notification.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : ''}
              ${notification.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : ''}
            `}
          >
            {/* Icon based on notification type */}
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'info' && <Info size={18} className="text-primary" />}
              {notification.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
              {notification.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
              {notification.type === 'error' && <AlertCircle size={18} className="text-destructive" />}
            </div>
            <div className="flex-1 text-foreground">{notification.message}</div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
