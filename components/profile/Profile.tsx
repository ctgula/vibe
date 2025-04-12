"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/hooks/auth";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit, 
  LogOut, 
  User, 
  Music, 
  Mic, 
  Calendar, 
  Users2, 
  CheckCircle2,
  Upload,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

type ProfileData = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
};

export function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [editData, setEditData] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  
  const { user, profile: authProfile, guestId, isGuest, signOut } = useAuth();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // Shimmer animation for skeleton loading
  const shimmer = {
    hidden: { opacity: 0.3 },
    visible: { 
      opacity: 0.8,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 1.5
      }
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user && !guestId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`id.eq.${user?.id},id.eq.${guestId}`)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error loading profile",
            description: "Please try again later",
            variant: "destructive"
          });
          return;
        }
        
        if (data) {
          setProfile(data);
          setEditData({
            username: data.username || "",
            full_name: data.full_name || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, guestId, supabase, toast]);

  // Prevent auth redirect if we're just loading
  if (isLoading) {
    return (
      <div className="p-4">
        <motion.div
          variants={shimmer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </motion.div>
      </div>
    );
  }

  // Only show auth required if we're definitely not logged in and not a guest
  if (!user && !guestId && !isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-zinc-400">Please sign in to view your profile</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-6">
        <p className="text-zinc-400">Profile not found.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const handleEditSubmit = async () => {
    try {
      if (!user || !profile) return;
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          bio: editData.bio,
          avatar_url: editData.avatar_url || profile?.avatar_url,
          updated_at: new Date().toISOString(),
        });
      
      setEditOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image and not too large
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a preview URL
      setAvatarPreview(URL.createObjectURL(file));
      
      // Generate a unique file name
      const fileName = `${user?.id}-${new Date().getTime()}`;
      const fileExt = file.name.split(".").pop();
      const fullPath = `${fileName}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fullPath, file, {
          cacheControl: "3600",
          upsert: true,
        });
      
      if (error) throw error;
      
      // Get public URL for avatar
      const { data: publicURL } = supabase.storage
        .from("avatars")
        .getPublicUrl(fullPath);
      
      // Update edit data with new avatar URL
      setEditData({
        ...editData,
        avatar_url: publicURL.publicUrl,
      });
      
      toast({
        title: "Avatar uploaded",
        description: "Your new avatar has been uploaded."
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error uploading avatar",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {profile.full_name && (
                  <p className="text-zinc-400">{profile.full_name}</p>
                )}
                {isGuest && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                    Guest
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isGuest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-zinc-400">{profile.bio}</p>
          )}

          <div className="mt-6 flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.followers_count || 0}</div>
              <div className="text-sm text-zinc-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.following_count || 0}</div>
              <div className="text-sm text-zinc-400">Following</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6 pt-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-400">Username</label>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  {profile.full_name && (
                    <div>
                      <label className="text-sm text-zinc-400">Full Name</label>
                      <p className="font-medium">{profile.full_name}</p>
                    </div>
                  )}
                </div>
              </div>
              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bio</h3>
                  <p className="text-zinc-400">{profile.bio}</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="activity">
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
              <p className="text-zinc-400">
                Your activity will appear here once you start participating in rooms.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="rooms">
            <div className="text-center py-8">
              <Users2 className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rooms Yet</h3>
              <p className="text-zinc-400">
                Create or join rooms to see them listed here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading} onClick={handleEditSubmit}>
              {isUploading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
