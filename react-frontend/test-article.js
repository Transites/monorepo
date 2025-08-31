// Simple Node.js script to test the API endpoint
const fetch = require('node:fetch');

async function testArticleAPI() {
  try {
    console.log('Testing API endpoint...');
    const response = await fetch('http://localhost:1337/api/submissions/id/483b8124-f13c-4f14-870e-e0737e5a5b0f');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response Structure:');
    console.log('- Success:', data.success);
    console.log('- Message:', data.message);
    console.log('- Has data.submission:', !!data.data?.submission);
    console.log('- Article title:', data.data?.submission?.title);
    console.log('- Has content_html:', !!data.data?.submission?.content_html);
    console.log('- Content length:', data.data?.submission?.content_html?.length || 0);
    console.log('- Has metadata:', !!data.data?.submission?.metadata);
    console.log('- Birth date:', data.data?.submission?.metadata?.birth?.formatted);
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

testArticleAPI();