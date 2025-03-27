// Common type definitions for the application

// Re-export types from database
export * from './lib/database.types';

// Participant interface with is_host field
export interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  created_at: string;
  is_host: boolean;
  is_speaker?: boolean;
  is_muted?: boolean;
  has_raised_hand?: boolean;
  joined_at?: string;
}

// Additional application-specific types
export interface RoomWithDetails {
  id: string;
  name: string;
  description?: string;
  host_id: string;
  is_private: boolean;
  has_camera: boolean;
  created_at: string;
  last_active_at?: string;
  participant_count?: number;
  host?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}