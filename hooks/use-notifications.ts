import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.user?.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });
      setNotifications(data || []);
    };
    fetchNotifications();

    const subscribeToNotifications = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) return;

      const subscription = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return subscription;
    };

    const subscription = subscribeToNotifications();

    return () => {
      subscription.then(sub => sub?.unsubscribe());
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  return { notifications, markAsRead };
}
