// pages/api/handle-new-user.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Add CORS headers to allow Supabase to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log the webhook payload for debugging
  console.log('Webhook triggered: handle-new-user');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body));

  try {
    // Initialize Supabase client with service_role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Extract the user data from the webhook payload
    const { user } = req.body;

    if (!user) {
      console.error('No user data provided in webhook payload');
      return res.status(400).json({ error: 'No user data provided' });
    }
    
    console.log('Processing user:', user.id);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      console.log('Profile already exists for user:', user.id);
      return res.status(200).json({ message: 'Profile already exists' });
    }

    if (checkError && checkError.code !== 'PGRST116') { // Not found error
      console.error('Error checking existing profile:', checkError);
    }

    // Create username from email
    let username = '';
    if (user.email) {
      username = user.email.split('@')[0];
    } else {
      username = `user_${Math.floor(Math.random() * 1000000)}`;
    }

    // Add display name (fallback to username)
    const displayName = user.user_metadata?.display_name || 
                        user.user_metadata?.full_name || 
                        username;

    // Insert the user into the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        username: username,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_guest: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating profile:', error);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    console.log('Profile created successfully for user:', user.id);
    return res.status(201).json({ message: 'Profile created successfully' });
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
