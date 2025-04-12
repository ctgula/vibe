#!/usr/bin/env node

/**
 * Script to update the database schema
 * This script calls the MCP API to add missing columns to the database
 */

// Import fetch dynamically for compatibility with Node.js versions
const fetchModule = async () => {
  try {
    // Try to use native fetch (Node.js 18+)
    if (typeof fetch === 'function') {
      return { default: fetch };
    }
    // Fall back to node-fetch
    return await import('node-fetch');
  } catch (error) {
    console.error('Error importing fetch:', error);
    throw error;
  }
};

require('dotenv').config();

async function updateSchema() {
  console.log('🔄 Starting database schema update...');
  
  try {
    // Get the fetch function
    const { default: fetch } = await fetchModule();
    
    // Get the API URL from environment or use localhost in development
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const apiKey = process.env.INTERNAL_API_KEY || 'development';
    
    console.log(`📡 Connecting to API at ${baseUrl}/api/mcp/update-schema`);
    
    // Call the API endpoint to update the schema
    const response = await fetch(`${baseUrl}/api/mcp/update-schema`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update schema: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Database schema updated successfully!');
      console.log(result.message);
    } else {
      console.error('❌ Error updating schema:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the update
updateSchema();
