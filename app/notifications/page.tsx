"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, User, Mic, MegaphoneIcon, Calendar, Heart, ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock notification data - would come from API in real app
const notifications = [
  {
    id: "1",
    type: "mention",
    user: {
      name: "Alex Johnson",
      username: "alexj",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "mentioned you in a room",
    roomName: "Morning Tech Chat",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "follow",
    user: {
      name: "Sarah Wilson",
      username: "sarahw",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "started following you",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "invite",
    user: {
      name: "Tech Community",
      username: "techcomm",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "invited you to join a room",
    roomName: "Future of AI Discussion",
    time: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "like",
    user: {
      name: "Michael Brown",
      username: "michaelb",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "liked your post",
    postTitle: "Thoughts on the latest tech trends",
    time: "2 days ago",
    read: true,
  },
  {
    id: "5",
    type: "room",
    user: {
      name: "Design Talk",
      username: "designtalk",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "is live now",
    roomName: "UX/UI Best Practices",
    time: "Just now",
    read: false,
  },
];

// Helper to get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "follow":
      return <User className="h-4 w-4 text-indigo-400" />;
    case "mention":
      return <Mic className="h-4 w-4 text-violet-400" />;
    case "invite":
      return <Calendar className="h-4 w-4 text-blue-400" />;
    case "like":
      return <Heart className="h-4 w-4 text-pink-400" />;
    case "room":
      return <MegaphoneIcon className="h-4 w-4 text-cyan-400" />;
    default:
      return <Bell className="h-4 w-4 text-gray-400" />;
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(true);
  const [readItems, setReadItems] = useState<string[]>([]);
  
  // Apply haptic feedback for interactions
  const hapticFeedback = (pattern: number | number[] = 3) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    if (!readItems.includes(id)) {
      hapticFeedback(5);
      setReadItems([...readItems, id]);
    }
  };

  // Dismiss notification
  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback([5, 10, 5]);
    // In a real app, you would send a request to your backend
    // For now we'll just visually remove it
    setIsActive(false);
    
    // After animation completes, we would remove it from the array
    setTimeout(() => {
      setIsActive(true);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Cosmic background blobs with subtle animations */}
      <motion.div 
        className="cosmic-blob w-96 h-96 opacity-10 top-20 -left-48"
        animate={{ 
          scale: [1, 1.05, 1], 
          opacity: [0.1, 0.12, 0.1],
          x: [0, 5, 0],
          y: [0, 10, 0]
        }}
        transition={{ 
          duration: 8, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
      ></motion.div>
      
      <motion.div 
        className="cosmic-blob w-80 h-80 opacity-10 bottom-40 -right-40"
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.1, 0.15, 0.1],
          x: [0, -10, 0],
          y: [0, -5, 0]
        }}
        transition={{ 
          duration: 10, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 1
        }}
      ></motion.div>

      {/* Header */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 glass-effect backdrop-blur-lg"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container max-w-md mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <motion.div 
                whileTap={{ scale: 0.92 }} 
                transition={{ duration: 0.1 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    hapticFeedback(5);
                    router.back();
                  }}
                  className="cosmic-glow"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h1 className="text-xl font-semibold text-gradient">Notifications</h1>
              </motion.div>
            </div>
            <motion.div
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  hapticFeedback(5);
                  // In a real app, mark all as read functionality
                }}
                className="text-sm text-primary/80 hover:text-primary"
              >
                Mark all read
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <main className="container max-w-md mx-auto pt-20 pb-20 px-4">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isActive ? 1 : 0,
                y: isActive ? 0 : -10,
                height: isActive ? 'auto' : 0
              }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              onClick={() => markAsRead(notification.id)}
              className={`glass-effect rounded-xl p-4 mb-3 transition-all ${
                readItems.includes(notification.id) || notification.read ? "opacity-80" : ""
              }`}
            >
              <div className="flex items-start">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={notification.user.avatar} alt={notification.user.name} className="object-cover" />
                    <AvatarFallback>{notification.user.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/10 backdrop-blur-md">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium truncate">
                      <span className="text-white">{notification.user.name}</span>
                    </p>
                    <div className="flex items-center ml-2">
                      <span className="text-xs text-white/60">{notification.time}</span>
                      {(!readItems.includes(notification.id) && !notification.read) && (
                        <motion.div 
                          className="ml-2 h-2 w-2 rounded-full bg-indigo-500"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mt-0.5">
                    {notification.content}
                    {notification.roomName && (
                      <span className="font-medium"> {notification.roomName}</span>
                    )}
                    {notification.postTitle && (
                      <span className="font-medium"> {notification.postTitle}</span>
                    )}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.1 }}
                  onClick={(e) => dismissNotification(notification.id, e)}
                  className="ml-2 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-60 glass-effect rounded-xl py-10"
          >
            <Bell className="h-10 w-10 text-white/30 mb-4" strokeWidth={1.5} />
            <p className="text-white/60 text-center">No notifications yet</p>
            <p className="text-white/40 text-sm text-center mt-1">
              When you get notifications, they'll appear here
            </p>
          </motion.div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
