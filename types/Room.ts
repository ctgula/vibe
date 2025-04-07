export interface Room {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_active: boolean;
  last_active_at?: string;
  topics?: string[];
  theme?: any; // jsonb type, can be any JSON object
  created_at: string;
  enable_video?: boolean;
  listener_count?: number;
  participant_count?: number;
  is_public?: boolean;
  tags?: string[];
}
