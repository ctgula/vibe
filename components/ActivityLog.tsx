import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export function ActivityLog({ roomId }: { roomId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activity_logs")
        .select("*, profiles(name, avatar_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      setLogs(data || []);
      setLoading(false);
    };
    
    fetchLogs();

    const subscription = supabase
      .channel("activity_logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          // Fetch the user profile data for the new log
          const fetchProfileForLog = async () => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", payload.new.user_id)
              .single();
              
            setLogs((prev) => [{
              ...payload.new,
              profiles: profile
            }, ...prev]);
          };
          
          fetchProfileForLog();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const logDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - logDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'joined':
        return 'joined the room';
      case 'left':
        return 'left the room';
      case 'raised_hand':
        return 'raised their hand';
      case 'promoted':
        return 'was promoted to speaker';
      case 'demoted':
        return 'was moved to audience';
      case 'muted':
        return 'was muted';
      case 'unmuted':
        return 'was unmuted';
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <h3 className="text-lg font-semibold text-white mb-2">Activity Log</h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <h3 className="text-lg font-semibold text-white mb-2">Activity Log</h3>
      
      {logs.length === 0 && (
        <p className="text-zinc-400 text-center py-3">No activity recorded yet.</p>
      )}
      
      <AnimatePresence>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 py-2 border-b border-zinc-700/30 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                {log.profiles?.avatar_url ? (
                  <img 
                    src={log.profiles.avatar_url} 
                    alt={log.profiles.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-xs font-bold">
                    {log.profiles?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200">
                  <span className="font-medium">{log.profiles?.name || 'Unknown user'}</span>{' '}
                  <span className="text-zinc-400">{getActionLabel(log.action)}</span>
                </p>
                {log.details && (
                  <p className="text-xs text-zinc-500 truncate">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </p>
                )}
              </div>
              
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {formatTimeAgo(log.created_at)}
              </span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
