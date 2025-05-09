import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thowunoqksuyixbdqlur.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Starting automated fix...');

  // Read and execute the SQL migration
  const sqlPath = path.join(process.cwd(), 'migrations', 'fix_database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Executing database migrations...');
  const { error: sqlError } = await supabase.rpc('execute', { sql });
  if (sqlError) {
    throw new Error(`SQL execution failed: ${sqlError.message}`);
  }

  // Verify realtime subscriptions
  console.log('Verifying realtime subscriptions...');
  const { error: realtimeError } = await supabase
    .from('room_participants')
    .select('id')
    .limit(1)
    .single();
  
  if (realtimeError && realtimeError.message !== 'No rows found') {
    throw new Error(`Realtime verification failed: ${realtimeError.message}`);
  }

  // Clean up stale room participants
  console.log('Cleaning up stale room participants...');
  const { error: cleanupError } = await supabase
    .from('room_participants')
    .update({ is_active: false })
    .eq('is_active', null);

  if (cleanupError) {
    throw new Error(`Cleanup failed: ${cleanupError.message}`);
  }

  console.log('Fix completed successfully!');
}

main().catch(console.error);
