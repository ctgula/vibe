import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function useGuestSession() {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem('guestProfileId');

    if (storedId) {
      // Verify the profile still exists
      supabase
        .from('profiles')
        .select('id')
        .eq('id', storedId)
        .single()
        .then(({ data, error }) => {
          if (data) {
            console.log('✅ Found existing guest profile:', storedId);
            setGuestId(storedId);
          } else {
            console.log('❌ Stored profile not found, creating new one');
            localStorage.removeItem('guestProfileId');
            createGuestProfile();
          }
          setLoading(false);
        });
      return;
    }

    createGuestProfile();
  }, []);

  const createGuestProfile = async () => {
    try {
      const guestId = uuidv4();
      const guestNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const guestName = `Guest_${guestNumber}`;

      // Pick from a set of emoji/avatar URLs
      const avatars = [
        "https://api.dicebear.com/6.x/bottts-neutral/svg?seed=fox",
        "https://api.dicebear.com/6.x/bottts-neutral/svg?seed=otter",
        "https://api.dicebear.com/6.x/bottts-neutral/svg?seed=doge",
        "https://api.dicebear.com/6.x/bottts-neutral/svg?seed=cat",
        "https://api.dicebear.com/6.x/bottts-neutral/svg?seed=alien",
      ];
      const avatarUrl = avatars[Math.floor(Math.random() * avatars.length)];

      console.log('🔄 Creating new guest profile:', guestName);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: guestId,
          name: guestName,
          display_name: guestName,
          is_guest: true,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error) {
        console.log('✅ Guest profile created successfully:', data);
        localStorage.setItem('guestProfileId', guestId);
        setGuestId(guestId);
      } else {
        console.error('❌ Error creating guest profile:', error);
      }
    } catch (err) {
      console.error('❌ Error in createGuestProfile:', err);
    } finally {
      setLoading(false);
    }
  };

  return { guestId, loading };
}
