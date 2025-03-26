import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const createClientComponentClient = createClient;

export const createClientServerComponent = () =>
  createServerComponentClient({ cookies });

export const createClientServerAction = () =>
  createServerActionClient({ cookies });
