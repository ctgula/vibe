"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AvatarUpload({ userId, onUpload }: { userId: string, onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) {
      console.error('Upload error:', error.message);
      alert('Failed to upload avatar.');
    } else {
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onUpload(publicUrl.publicUrl);
    }

    setUploading(false);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
    </div>
  );
}
