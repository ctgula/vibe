import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useParticipantProfiles(participantIds: string[]) {
  const [profiles, setProfiles] = useState<{ [id: string]: any }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!participantIds.length) return;
    
    setLoading(true);
    
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", participantIds);
      
      if (error) {
        console.error("Error fetching profiles:", error);
        return;
      }
      
      if (data) {
        const map = Object.fromEntries(data.map((p) => [p.id, p]));
        setProfiles(map);
      }
      
      setLoading(false);
    };
    
    fetchProfiles();
    
    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=in.(${participantIds.join(',')})` 
      }, (payload: any) => {
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          setProfiles(prev => ({
            ...prev,
            [payload.new.id]: payload.new
          }));
        }
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [participantIds.join(',')]);

  return { profiles, loading };
}
