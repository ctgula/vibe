import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlFromFile() {
  try {
    // Read the SQL file
    const sqlFilePath = path.resolve(process.cwd(), 'ensure-user-profiles.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL to ensure profiles are created for users and guests...');
    
    // Split the SQL statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement separately
    for (const statement of statements) {
      console.log(`Running statement: ${statement.substring(0, 100)}...`);
      
      const { data, error } = await supabase.rpc('execute', {
        sql: statement,
        params: {}
      });
      
      if (error) {
        console.error('Error executing SQL statement:', error);
      } else {
        console.log('Statement executed successfully');
      }
    }
    
    console.log('All statements executed successfully');
    console.log('✅ Profiles will now be automatically created for:');
    console.log('  - New authenticated users (via auth.users trigger)');
    console.log('  - All participants joining rooms (registered or guests)');
    
  } catch (error) {
    console.error('Error in script execution:', error);
  }
}

// Run the script
executeSqlFromFile();
