"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Edit, Heart, MessageCircle, Share2, Clock, Music, Bookmark } from "lucide-react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/auth"
import { supabase, Profile } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Define post type for TypeScript
interface Post {
  id: string
  user_id: string
  title: string
  duration: number
  likes: number
  comments: number
  shares: number
  audio_url: string
  created_at: string
}

// Post item component with optimized rendering
const PostItem = ({ post, index, userAvatar }: { post: Post; index: number; userAvatar: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1.0] // Cubic bezier for iOS-like easing
      }}
      whileTap={{ scale: 0.98 }}
      className="border rounded-lg overflow-hidden h-24 flex shadow-sm will-change-transform"
    >
      <div className="bg-primary/10 w-24 flex items-center justify-center">
        <motion.div 
          className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="h-6 w-6 rounded-full bg-primary" />
        </motion.div>
      </div>
      <div className="flex-1 p-4">
        <h3 className="font-medium truncate">{post.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{post.duration}s</span>
          <span>•</span>
          <span>{post.likes} likes</span>
        </div>
      </div>
    </motion.div>
  )
}

// Create a motion button component
const MotionButton = motion(Button)

export function UserProfile() {
  const { user } = useAuth()
  const { profile, isLoading, updateProfile } = useProfile()
  const [activeTab, setActiveTab] = useState("posts")
  const [isLoaded, setIsLoaded] = useState(false)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isPostsLoading, setIsPostsLoading] = useState(true)
  const router = useRouter()
  
  // Fetch user's posts from Supabase
  useEffect(() => {
    if (!user) return
    
    const fetchUserPosts = async () => {
      try {
        setIsPostsLoading(true)
        
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setUserPosts(data || [])
      } catch (err) {
        console.error("Error fetching user posts:", err)
      } finally {
        setIsPostsLoading(false)
      }
    }
    
    fetchUserPosts()
    
    // Set up real-time subscription for posts
    const postsSubscription = supabase
      .channel(`posts-channel-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${user.id}` }, 
        () => {
          fetchUserPosts() // Refetch posts when changes occur
        }
      )
      .subscribe()
    
    return () => {
      if (postsSubscription) {
        supabase.removeChannel(postsSubscription)
      }
    }
  }, [user?.id])
  
  // Simulate content loading for smooth transitions
  useEffect(() => {
    setIsLoaded(true)
    
    // Add iOS-specific touch handling for better performance
    document.addEventListener('touchstart', function() {}, {passive: true})
  }, [])
  
  const handleTabChange = (value: string) => {
    // Apply haptic feedback if available (iOS-like)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(3) // Very short vibration for tap feedback
    }
    setActiveTab(value)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: "easeInOut" 
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
        />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p>Profile not found. Please sign in again.</p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/auth/login')}
        >
          Sign In
        </Button>
      </div>
    )
  }
  
  return (
    <motion.div 
      className="px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex justify-between items-start mb-6"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative z-10"
          >
            <Avatar className="h-20 w-20 border-2 border-white/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-blue-500/20 rounded-full backdrop-blur-sm"></div>
              <AvatarImage 
                src={profile.avatar_url || "/placeholder.svg?height=100&width=100"} 
                alt={(profile as any).full_name || (profile as any).username} 
                className="object-cover scale-[1.01]"
                style={{ 
                  imageRendering: 'auto' as const,
                  transform: 'translateZ(0)'
                }}
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-700">
                {((profile as any).full_name || (profile as any).username || "User").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-30 blur-md -z-10"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.35, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold">{(profile as any).full_name || (profile as any).username}</h1>
            <p className="text-muted-foreground">@{(profile as any).username}</p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button variant="outline" size="icon" className="rounded-full">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div 
        className="mb-6"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <p className="text-sm">{(profile as any).bio || "No bio yet"}</p>
        <div className="flex gap-4 mt-2">
          <p className="text-sm">
            <span className="font-bold">{0}</span> followers
          </p>
          <p className="text-sm">
            <span className="font-bold">{0}</span> following
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <MotionButton 
          className="w-full mb-6 relative overflow-hidden group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => {
            // Apply haptic feedback for interaction
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(3); // Short vibration for iOS-like feedback
            }
            
            // Navigate to edit profile page
            window.location.href = "/profile/edit";
          }}
        >
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-md"
            initial={{ x: "-100%", opacity: 0.5 }}
            whileHover={{ x: "100%", opacity: 0.8 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <motion.span 
            className="absolute inset-0 bg-primary/10 rounded-md"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <Edit className="h-4 w-4 mr-2 relative z-10" />
          <span className="relative z-10">Edit Profile</span>
        </MotionButton>
      </motion.div>

      <Tabs 
        defaultValue="posts" 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="posts"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200"
          >
            <Music className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="favorites"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200"
          >
            <Heart className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>
        
        <AnimatePresence mode="wait">
          {activeTab === "posts" && (
            <TabsContent value="posts" className="mt-2 focus-visible:outline-none focus-visible:ring-0">
              {userPosts.length > 0 ? (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {userPosts.map((post, index) => (
                    <PostItem key={post.id} post={post} index={index} userAvatar={profile.avatar_url || "/placeholder.svg?height=50&width=50"} />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-muted-foreground">No posts yet</p>
                </motion.div>
              )}
            </TabsContent>
          )}
          
          {activeTab === "favorites" && (
            <TabsContent value="favorites" className="mt-2 focus-visible:outline-none focus-visible:ring-0">
              <motion.div 
                className="text-center py-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-muted-foreground">No favorites yet</p>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}
