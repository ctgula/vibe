import { useNotifications } from "@/hooks/use-notifications";
import { motion, AnimatePresence } from "framer-motion";

export function Notifications() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="max-w-md w-full">
      <h3 className="text-lg font-semibold text-gradient mb-3">Notifications</h3>
      <AnimatePresence>
        {notifications.length === 0 && (
          <div className="text-center py-6 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <p className="text-zinc-400">No new notifications.</p>
          </div>
        )}
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-4 mb-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white">{notification.content.message}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition-colors"
              >
                Mark as Read
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
