// hooks/useParticipants.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // make sure this path is right

export function useParticipants(roomId: string) {
  const [stage, setStage] = useState<any[]>([]);
  const [listeners, setListeners] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('room_participants')
        .select('*, profiles(name, avatar_url)')
        .eq('room_id', roomId);

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      const speakers = data.filter((p) => p.is_speaker);
      const audience = data.filter((p) => !p.is_speaker);

      setStage(speakers);
      setListeners(audience);
    };

    fetchParticipants();

    const interval = setInterval(fetchParticipants, 4000);
    return () => clearInterval(interval);
  }, [roomId]);

  return { stage, listeners };
}
