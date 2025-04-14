'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, ArrowLeft, Camera, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AvatarStepProps {
  avatarUrl: string;
  onUpdate: (avatarUrl: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AvatarStep({ avatarUrl, onUpdate, onNext, onBack }: AvatarStepProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large (max 5MB)');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        onUpdate(data.publicUrl);
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full px-dynamic-sm md:px-0"
    >
      <div className="text-center mb-dynamic-lg">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-dynamic-md"
        >
          <Camera className="w-8 h-8 text-indigo-400" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-adaptive-2xl font-bold text-white mb-2"
        >
          Add a profile picture
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-adaptive-base text-zinc-400"
        >
          Show your personality with a profile picture
        </motion.p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-dynamic-md">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <motion.div 
            className="w-36 h-36 rounded-full relative overflow-hidden border-2 border-indigo-500/50 mb-4 bg-zinc-800 shadow-lg shadow-indigo-500/20"
            onClick={triggerFileInput}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            {preview ? (
              <img 
                src={preview} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                <Upload className="w-10 h-10 text-indigo-400" />
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
          </motion.div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <motion.button
            type="button"
            onClick={triggerFileInput}
            disabled={uploading}
            className="text-adaptive-sm text-indigo-400 hover:text-indigo-300 transition-colors py-2 px-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {preview ? 'Change picture' : 'Upload picture'}
          </motion.button>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-adaptive-sm text-red-500 text-center"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
        
        <div className="flex gap-dynamic-sm">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBack}
            className="flex-1 py-4 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors min-h-touch-lg text-adaptive-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={uploading}
            className="flex-1 py-4 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors min-h-touch-lg text-adaptive-base"
          >
            Continue
          </motion.button>
        </div>
        
        <motion.div 
          className="text-center pt-dynamic-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.button
            type="button"
            onClick={handleSkip}
            className="text-adaptive-sm text-zinc-500 hover:text-zinc-400 transition-colors py-3 px-4 inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip for now
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
