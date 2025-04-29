const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Fallback to .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  process.exit(1);
}

// Create MCP config
const mcpConfig = {
  supabase: {
    url: supabaseUrl,
    key: supabaseKey,
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
};

// Write config to file
const configPath = path.resolve(process.cwd(), '.mcp-supabase.json');
fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));

console.log(`MCP Supabase configuration created at ${configPath}`);
console.log('Supabase URL:', supabaseUrl);
console.log('Configuration complete. MCP should now be able to connect to your Supabase project.');
