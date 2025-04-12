// Script to list all tables in the Supabase project
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the environment variables you set earlier
const supabaseUrl = 'https://thowunoqksuyixbdqlur.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // Execute raw SQL to get all tables in the public schema
    const { data, error } = await supabase.rpc('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      // Try an alternative approach if the first one fails
      const { data: altData, error: altError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (altError) {
        // If both approaches fail, try a direct SQL query
        const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
          query: "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
        });
        
        if (sqlError) {
          // Last resort: try a raw SQL query
          const { data: rawData, error: rawError } = await supabase.rpc('execute_sql', {
            sql: "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
          });
          
          if (rawError) {
            throw rawError;
          }
          
          console.log('Tables in your Supabase project:');
          rawData.forEach((row, index) => {
            console.log(`${index + 1}. ${row.tablename}`);
          });
          return;
        }
        
        console.log('Tables in your Supabase project:');
        sqlData.forEach((row, index) => {
          console.log(`${index + 1}. ${row.tablename}`);
        });
        return;
      }
      
      console.log('Tables in your Supabase project:');
      altData.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
      return;
    }

    console.log('Tables in your Supabase project:');
    data.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`);
    });
  } catch (error) {
    console.error('Error listing tables:', error);
    
    // Fallback to hardcoded tables from the database.types.ts file
    console.log('\nFalling back to known tables from your project files:');
    const knownTables = [
      'profiles',
      'rooms',
      'room_participants',
      'room_messages',
      'activity_logs'
    ];
    
    knownTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
  }
}

listTables();
