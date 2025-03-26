// Common type definitions for the application

// Re-export types from database
export * from './lib/database.types';

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