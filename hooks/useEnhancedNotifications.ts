import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";

export type Notification = {
  id: string;
  user_id: string;
  content: {
    type: string;
    message: string;
    data?: any;
  };
  created_at: string;
  is_read: boolean;
};

export function useEnhancedNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { guestId, user, isGuest } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      const profileId = user?.id || guestId;

      if (!profileId) return;
      
      // Fetch notifications for the user (authenticated or guest)
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      const notificationData = data || [];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.is_read).length);
    };
    
    fetchNotifications();

    const subscribeToNotifications = async () => {
      const profileId = user?.id || guestId;

      if (!profileId) return null;

      const subscription = supabase
        .channel(`notifications-${profileId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profileId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setNotifications((prev) => [payload.new as Notification, ...prev]);
              setUnreadCount(count => count + 1);
              
              // Show browser notification if supported
              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  const notification = new Notification('New Vibe Notification', {
                    body: (payload.new as Notification).content.message,
                    icon: '/icon.png'
                  });
                  
                  notification.onclick = () => {
                    window.focus();
                  };
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission();
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => 
                prev.map(n => n.id === (payload.new as Notification).id ? (payload.new as Notification) : n)
              );
              
              // Recalculate unread count
              setUnreadCount(count => {
                const oldIsRead = payload.old.is_read;
                const newIsRead = payload.new.is_read;
                
                if (!oldIsRead && newIsRead) return count - 1;
                if (oldIsRead && !newIsRead) return count + 1;
                return count;
              });
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
              
              if (!payload.old.is_read) {
                setUnreadCount(count => count - 1);
              }
            }
          }
        )
        .subscribe();

      return subscription;
    };

    const subscription = subscribeToNotifications();

    return () => {
      if (subscription) {
        subscription.then(sub => sub?.unsubscribe());
      }
    };
  }, [user, guestId]);

  // Create a notification for the current user
  const createNotification = async (message: string, type = 'info', data?: any) => {
    const profileId = user?.id || guestId;

    if (!profileId) return;

    await supabase
      .from("notifications")
      .insert({
        user_id: profileId,
        content: { type, message, data },
        is_read: false,
        created_at: new Date().toISOString()
      });
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
      
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    
    setUnreadCount(count => Math.max(0, count - 1));
  };

  const markAllAsRead = async () => {
    const profileId = user?.id || guestId;

    if (!profileId) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profileId)
      .eq("is_read", false);
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    );
    
    setUnreadCount(0);
  };

  return { 
    notifications, 
    unreadCount,
    createNotification,
    markAsRead, 
    markAllAsRead 
  };
}
