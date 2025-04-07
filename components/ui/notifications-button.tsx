'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsButton() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useEnhancedNotifications();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.div 
          whileTap={{ scale: 0.94 }} 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.1 }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-lg transition-transform"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-white" />
            {unreadCount > 0 && (
              <motion.span 
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-[10px] font-bold text-white"
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: [0.8, 1, 0.8],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                {unreadCount}
              </motion.span>
            )}
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 max-h-[70vh] p-0 bg-zinc-900/90 backdrop-blur-lg border border-zinc-700/30 shadow-2xl rounded-xl"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/30">
          <h3 className="text-base font-medium text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[50vh]">
          {notifications.length > 0 ? (
            <div className="py-1">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${
                    !notification.is_read ? 'bg-indigo-900/10' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3 items-start">
                    <div 
                      className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${
                        !notification.is_read ? 'bg-indigo-500' : 'bg-zinc-600'
                      }`} 
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-white">
                        {notification.content.message}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-400">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
