import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Upload, X, Download, File, Loader2, Music, Video, Image as ImageIcon, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FileUploader({ roomId }: { roomId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("files")
          .select("*, profiles(name, avatar_url)")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        setFiles(data || []);
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Failed to load shared files");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
    
    // Set up real-time subscription for new files
    const subscription = supabase
      .channel("files-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "files",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the complete file record with user profile
          const { data } = await supabase
            .from("files")
            .select("*, profiles(name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
            
          if (data) {
            setFiles(prev => [data, ...prev]);
          }
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  
  const handleDragLeave = () => {
    setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 50MB.`);
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        setError("You must be logged in to upload files");
        return;
      }
      
      // Create a unique file path including original extension
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("room-files")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("room-files")
        .getPublicUrl(filePath);
        
      // Save the file metadata to the database
      const { error: dbError } = await supabase.from("files").insert({
        room_id: roomId,
        user_id: user.user.id,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        public_url: publicUrlData.publicUrl
      });
      
      if (dbError) throw dbError;
      
      setSuccess(`${file.name} uploaded successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const fileDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - fileDate.getTime()) / 1000);
    
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
  
  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <File className="w-6 h-6 text-zinc-400" />;
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6 text-blue-400" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="w-6 h-6 text-green-400" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-6 h-6 text-pink-400" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="w-6 h-6 text-red-400" />;
    } else {
      return <File className="w-6 h-6 text-zinc-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          Shared Files
        </h3>
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-400" />
        Shared Files
      </h3>
      
      {/* Status messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/20 border border-red-500/30 text-red-200 px-3 py-2 rounded-md mb-3 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/20 border border-green-500/30 text-green-200 px-3 py-2 rounded-md mb-3 text-sm flex items-start gap-2"
          >
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* File upload area */}
      <div 
        className={`border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center mb-6 transition-colors ${
          dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'hover:border-zinc-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
          ref={fileInputRef}
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
        />
        
        {uploading ? (
          <div className="py-6">
            <div className="flex justify-center mb-2">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <p className="text-zinc-300 mb-2">Uploading file... {uploadProgress}%</p>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div 
            className="py-6 cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex justify-center mb-3">
              <Upload className="w-10 h-10 text-zinc-400" />
            </div>
            <p className="text-zinc-300">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              Max file size: 50MB
            </p>
          </div>
        )}
      </div>
      
      {/* Files list */}
      {files.length === 0 ? (
        <p className="text-zinc-400 text-center py-6">No files have been shared in this room yet.</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/70 rounded-lg p-3 flex items-center"
            >
              <div className="mr-3">
                {getFileIcon(file.mime_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{file.file_name}</p>
                <div className="flex items-center text-xs text-zinc-400 mt-1">
                  <span>
                    {formatFileSize(file.file_size)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {file.profiles?.name || 'Unknown user'}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {formatTimeAgo(file.created_at)}
                  </span>
                </div>
              </div>
              
              <a
                href={file.public_url || supabase.storage.from("room-files").getPublicUrl(file.file_path).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={file.file_name}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Download file"
              >
                <Download className="w-5 h-5" />
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
