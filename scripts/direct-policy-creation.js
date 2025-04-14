// Direct script to create a policy on the rooms table using environment variables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createRoomsPolicy() {
  try {
    console.log('🔍 Creating "Allow all test" policy on rooms table...');
    
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials in .env file');
      console.log('Required variables:');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    
    console.log(`🔗 Connecting to Supabase at: ${supabaseUrl}`);
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First check if the rooms table exists
    console.log('📋 Checking if rooms table exists...');
    const { data: roomsCheck, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    if (roomsError) {
      console.log('⚠️ Rooms table check error:', roomsError.message);
      
      // If the table doesn't exist, create it
      if (roomsError.message.includes('does not exist')) {
        console.log('📝 Creating rooms table...');
        
        // Use raw SQL to create the table
        const { error: createError } = await supabase.rpc('execute', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.rooms (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              description TEXT,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              created_by UUID,
              is_active BOOLEAN DEFAULT TRUE
            );
          `
        });
        
        if (createError) {
          console.error('❌ Failed to create rooms table:', createError.message);
          process.exit(1);
        }
        
        console.log('✅ Rooms table created successfully');
      } else {
        console.error('❌ Unexpected error checking rooms table:', roomsError.message);
      }
    } else {
      console.log('✅ Rooms table exists with', roomsCheck.length, 'rows');
    }
    
    // Try to drop the policy if it exists (to avoid duplicates)
    console.log('🗑️ Dropping existing policy if it exists...');
    try {
      await supabase.rpc('execute', {
        sql: `DROP POLICY IF EXISTS "Allow all test" ON public.rooms;`
      });
      console.log('✅ Dropped existing policy (or none existed)');
    } catch (dropError) {
      console.log('⚠️ Could not drop policy:', dropError.message);
    }
    
    // Create the policy
    console.log('📝 Creating "Allow all test" policy...');
    const { error: policyError } = await supabase.rpc('execute', {
      sql: `CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);`
    });
    
    if (policyError) {
      console.error('❌ Failed to create policy:', policyError.message);
      process.exit(1);
    }
    
    console.log('✅ Policy "Allow all test" created successfully on rooms table');
    
    // Verify the policy was created
    console.log('🔍 Verifying policy was created...');
    const { data: policies, error: listError } = await supabase.rpc('execute', {
      sql: `
        SELECT * FROM pg_policies 
        WHERE tablename = 'rooms' AND policyname = 'Allow all test';
      `
    });
    
    if (listError) {
      console.error('⚠️ Could not verify policy creation:', listError.message);
    } else {
      console.log('📋 Policy details:', policies);
    }
    
    console.log('🎉 All done!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the function
createRoomsPolicy();
