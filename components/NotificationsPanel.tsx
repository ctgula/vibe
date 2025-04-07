import { useEnhancedNotifications, Notification } from "@/hooks/useEnhancedNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface NotificationsPanelProps {
  autoShow?: boolean;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'center';
}

export function NotificationsPanel({ 
  autoShow = false,
  position = 'top-right' 
}: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useEnhancedNotifications();
  const [isVisible, setIsVisible] = useState(autoShow);

  // Auto show when new notifications arrive
  useEffect(() => {
    if (!isVisible && unreadCount > 0) {
      setIsVisible(true);
    }
  }, [unreadCount, isVisible]);

  // Get position classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <>
      {/* Notification bell button with counter */}
      {!isVisible && (
        <motion.button
          className="fixed z-50 top-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          onClick={() => setIsVisible(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </motion.button>
      )}

      {/* Notifications panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed z-50 ${getPositionClasses()} max-w-md w-full p-4 rounded-xl bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-lg border border-zinc-700/50 shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-zinc-400 hover:text-white flex items-center"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsVisible(false)}
                  className="h-7 w-7 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto hide-scrollbar pr-1">
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                    <p className="text-zinc-400">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((notification: Notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mb-3 p-3 rounded-lg border transition-colors ${
                        notification.is_read 
                          ? 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400' 
                          : 'bg-zinc-800/60 border-indigo-600/30 text-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={notification.is_read ? 'text-zinc-300' : 'text-white'}>
                            {notification.content.message}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {new Date(notification.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
