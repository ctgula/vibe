// Script to test the specialized policy creation endpoint
const http = require('http');

async function testCreatePolicy() {
  try {
    console.log('🔍 Testing specialized policy creation endpoint...');
    
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
    
    // Call the specialized endpoint
    const result = await makeRequest('http://localhost:3001/api/mcp/create-rooms-policy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {});
    
    if (result.data.error) {
      console.error('❌ Error creating policy:', result.data.error);
      if (result.data.details) {
        console.error('Details:', result.data.details);
      }
      process.exit(1);
    }
    
    console.log('✅ Policy creation successful!');
    console.log('Result:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the test
testCreatePolicy();
