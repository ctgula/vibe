// Script to test the MCP SQL execution API
const http = require('http');
const https = require('https');

async function testMcpSql() {
  try {
    console.log('🔍 Testing MCP SQL execution API...');
    
    // Function to make HTTP requests
    const makeRequest = (url, options, data) => {
      return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(responseData);
              resolve({ statusCode: res.statusCode, data: parsedData });
            } catch (e) {
              reject(new Error(`Failed to parse response: ${e.message}`));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        if (data) {
          req.write(JSON.stringify(data));
        }
        
        req.end();
      });
    };
    
    // Test SELECT query
    console.log('Testing simple SELECT query...');
    const selectResult = await makeRequest('http://localhost:3001/api/mcp/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {
      sql: 'SELECT NOW();'
    });
    
    if (selectResult.data.error) {
      console.error('❌ Error executing SQL:', selectResult.data.error);
      if (selectResult.data.details) {
        console.error('Details:', selectResult.data.details);
      }
      if (selectResult.data.directError) {
        console.error('Direct error:', selectResult.data.directError);
      }
      process.exit(1);
    }
    
    console.log('✅ SQL execution successful!');
    console.log('Result:', JSON.stringify(selectResult.data, null, 2));
    
    // Test CREATE POLICY
    console.log('\n🔍 Testing policy creation...');
    
    const policyResult = await makeRequest('http://localhost:3001/api/mcp/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {
      sql: 'CREATE POLICY "Allow all test" ON public.rooms FOR SELECT USING (true);'
    });
    
    if (policyResult.data.error) {
      console.error('❌ Error creating policy:', policyResult.data.error);
      if (policyResult.data.details) {
        console.error('Details:', policyResult.data.details);
      }
      if (policyResult.data.directError) {
        console.error('Direct error:', policyResult.data.directError);
      }
    } else {
      console.log('✅ Policy creation successful!');
      console.log('Result:', JSON.stringify(policyResult.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the test
testMcpSql();
