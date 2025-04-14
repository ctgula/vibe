// Script to test the MCP SQL execution API
const fetch = require('node-fetch');

async function testMcpSql() {
  try {
    console.log('🔍 Testing MCP SQL execution API...');
    
    // Make sure the app is running on localhost:3000
    const res = await fetch('http://localhost:3000/api/mcp/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT NOW();'
      }),
    });
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error executing SQL:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
      if (data.directError) {
        console.error('Direct error:', data.directError);
      }
      process.exit(1);
    }
    
    console.log('✅ SQL execution successful!');
    console.log('Result:', JSON.stringify(data, null, 2));
    
    // Now try to create a policy
    console.log('\n🔍 Testing policy creation...');
    
    const policyRes = await fetch('http://localhost:3000/api/mcp/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);'
      }),
    });
    
    const policyData = await policyRes.json();
    
    if (policyData.error) {
      console.error('❌ Error creating policy:', policyData.error);
      if (policyData.details) {
        console.error('Details:', policyData.details);
      }
      if (policyData.directError) {
        console.error('Direct error:', policyData.directError);
      }
    } else {
      console.log('✅ Policy creation successful!');
      console.log('Result:', JSON.stringify(policyData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the test
testMcpSql();
