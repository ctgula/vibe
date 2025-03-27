import { supabase } from "@/lib/supabase";

/**
 * Log an activity in a room
 * @param roomId The room ID where the activity happened
 * @param userId The user ID who performed the action
 * @param action The action performed (e.g., 'joined', 'left', 'raised_hand', etc.)
 * @param details Optional additional details about the action
 * @returns Promise with the result of the insert operation
 */
export const logActivity = async (
  roomId: string, 
  userId: string, 
  action: string, 
  details?: object | string
) => {
  return await supabase.from("activity_logs").insert({
    room_id: roomId,
    user_id: userId,
    action,
    details,
    created_at: new Date().toISOString()
  });
};

/**
 * Fetch recent activity logs for a room
 * @param roomId The room ID to fetch logs for
 * @param limit Maximum number of logs to fetch
 * @returns Promise with the activity logs
 */
export const fetchActivityLogs = async (roomId: string, limit: number = 50) => {
  return await supabase
    .from("activity_logs")
    .select("*, profiles(name, avatar_url)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);
};
