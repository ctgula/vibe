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
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Add a profile picture</h2>
        <p className="text-zinc-400">Show your personality with a profile picture</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center">
          <div 
            className="w-32 h-32 rounded-full relative overflow-hidden border-2 border-indigo-500/50 mb-4 bg-zinc-800"
            onClick={triggerFileInput}
          >
            {preview ? (
              <img 
                src={preview} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={uploading}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {preview ? 'Change picture' : 'Upload picture'}
          </button>
          
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={uploading}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Continue
          </motion.button>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </form>
    </motion.div>
  );
}
