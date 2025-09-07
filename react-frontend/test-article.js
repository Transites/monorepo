// Simple Node.js script to test the API endpoint
import fetch from 'node-fetch';

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
    
    // Show actual content structure
    console.log('\n🔍 Content HTML Structure:');
    const content = data.data?.submission?.content_html;
    if (content) {
      console.log('First 500 chars:', content.substring(0, 500));
      console.log('\nParagraph analysis:');
      const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
      if (paragraphs) {
        console.log('- Found', paragraphs.length, 'paragraph tags');
        console.log('- First paragraph:', paragraphs[0]?.substring(0, 100) + '...');
      } else {
        console.log('- No <p> tags found');
        const lineBreaks = content.split('\n').filter(line => line.trim().length > 0);
        console.log('- Lines of content:', lineBreaks.length);
        console.log('- First line:', lineBreaks[0]?.substring(0, 100) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

testArticleAPI();