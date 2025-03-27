import { supabase } from "@/lib/supabase";

/**
 * Send a notification to a user
 * @param userId The user ID to send the notification to
 * @param content Object containing notification content (e.g. {message: "New message"})
 * @param type The notification type (e.g. "new_message", "invite", etc.)
 * @returns Promise with the result of the insert operation
 */
export const sendNotification = async (userId: string, content: object, type: string = "general") => {
  return await supabase.from("notifications").insert({
    user_id: userId,
    type,
    content,
    is_read: false,
    created_at: new Date().toISOString()
  });
};

/**
 * Mark all notifications as read for a user
 * @param userId The user ID to mark notifications for
 * @returns Promise with the result of the update operation
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  return await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
};
