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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // First check if the rooms table exists
    console.log('📋 Checking if rooms table exists...');
    const { data: roomsCheck, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    console.log('Rooms check result:', roomsCheck ? 'success' : 'failed', roomsError ? roomsError.message : 'no error');
    
    // Create the policy using direct SQL
    console.log('📝 Creating "Allow all test" policy...');
    
    // We need to use the Postgres extension directly
    const { data: policyResult, error: policyError } = await supabase
      .from('_pgsql_raw')
      .select('*')
      .execute(`CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);`);
    
    if (policyError) {
      console.error('❌ Failed to create policy:', policyError.message);
      
      // Try alternative approach with auth.admin API
      console.log('🔄 Trying alternative approach...');
      
      try {
        // Make a direct API call to the Supabase management API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_policy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            table_name: 'rooms',
            policy_name: 'Allow all test',
            policy_definition: 'true',
            policy_operation: 'SELECT'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API call failed: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Policy created via API:', result);
      } catch (apiError) {
        console.error('❌ API approach failed:', apiError.message);
        
        // Last resort: try using the SQL API
        console.log('🔄 Trying SQL API approach...');
        
        try {
          const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'params=single-object'
            },
            body: JSON.stringify({
              query: `CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);`
            })
          });
          
          if (!sqlResponse.ok) {
            const errorText = await sqlResponse.text();
            throw new Error(`SQL API call failed: ${sqlResponse.status} ${errorText}`);
          }
          
          const sqlResult = await sqlResponse.json();
          console.log('✅ Policy created via SQL API:', sqlResult);
        } catch (sqlApiError) {
          console.error('❌ SQL API approach failed:', sqlApiError.message);
          
          // Final fallback: suggest manual creation
          console.log('\n📌 MANUAL STEPS:');
          console.log('Since automated policy creation failed, please create the policy manually:');
          console.log('1. Go to https://app.supabase.com');
          console.log('2. Select your project');
          console.log('3. Go to Authentication > Policies');
          console.log('4. Find the "rooms" table');
          console.log('5. Click "New Policy"');
          console.log('6. Choose "Select" for the operation');
          console.log('7. Enter "Allow all test" for the policy name');
          console.log('8. Enter "true" for the policy definition');
          console.log('9. Click "Save Policy"');
          
          process.exit(1);
        }
      }
    } else {
      console.log('✅ Policy created successfully:', policyResult);
    }
    
    console.log('🎉 All done!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    // Provide manual steps as a fallback
    console.log('\n📌 MANUAL STEPS:');
    console.log('Since automated policy creation failed, please create the policy manually:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to Authentication > Policies');
    console.log('4. Find the "rooms" table');
    console.log('5. Click "New Policy"');
    console.log('6. Choose "Select" for the operation');
    console.log('7. Enter "Allow all test" for the policy name');
    console.log('8. Enter "true" for the policy definition');
    console.log('9. Click "Save Policy"');
    
    process.exit(1);
  }
}

// Run the function
createRoomsPolicy();
