import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';

// Client automatically uses environment variables
export const supabase = createClientComponentClient<Database>();
